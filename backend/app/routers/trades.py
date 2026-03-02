from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Market, Position, Trade, PriceHistory, User
from app.schemas import TradeRequest, TradeOut, TradePreview
from app.amm import calc_buy, calc_sell, get_prices
from app.auth import get_current_user

router = APIRouter(prefix="/markets", tags=["trades"])

MIN_AMOUNT = 0.01   # минимум для покупки (TON)
MAX_AMOUNT = 100_000.0


@router.get("/{market_id}/preview", response_model=TradePreview)
async def preview_trade(
    market_id: int,
    outcome: str,
    action: str,
    amount: float,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Market).where(Market.id == market_id))
    m = result.scalar_one_or_none()
    if not m or m.status != "active":
        raise HTTPException(404, "Market not found or not active")

    if action == "buy":
        data = calc_buy(outcome, amount, m.pool_yes, m.pool_no)
    else:
        data = calc_sell(outcome, amount, m.pool_yes, m.pool_no)
        data["shares_out"] = data["amount_out"]
        data["price_before"] = get_prices(m.pool_yes, m.pool_no)[outcome]
        data["slippage"] = 0.0

    return TradePreview(
        shares_out=data["shares_out"],
        price_avg=data["price_avg"],
        price_before=data["price_before"],
        slippage=data["slippage"],
        fee=data["fee"],
    )


@router.post("/{market_id}/trade", response_model=TradeOut)
async def execute_trade(
    market_id: int,
    body: TradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.outcome not in ("yes", "no"):
        raise HTTPException(400, "outcome must be yes or no")
    if body.action not in ("buy", "sell"):
        raise HTTPException(400, "action must be buy or sell")
    if body.amount <= 0:
        raise HTTPException(400, "amount must be positive")

    # Для покупки проверяем лимиты в монетах; для продажи в шерах
    if body.action == "buy" and (body.amount < MIN_AMOUNT or body.amount > MAX_AMOUNT):
        raise HTTPException(400, f"amount must be between {MIN_AMOUNT} and {MAX_AMOUNT}")

    result = await db.execute(select(Market).where(Market.id == market_id))
    m = result.scalar_one_or_none()
    if not m or m.status != "active":
        raise HTTPException(404, "Market not found or not active")

    # Получить или создать позицию
    pos_result = await db.execute(
        select(Position).where(
            Position.user_id == current_user.id,
            Position.market_id == market_id,
        )
    )
    position = pos_result.scalar_one_or_none()
    if not position:
        position = Position(
            user_id=current_user.id,
            market_id=market_id,
            shares_yes=0.0,
            shares_no=0.0,
            cost_basis=0.0,
        )
        db.add(position)

    if body.action == "buy":
        if current_user.balance < body.amount:
            raise HTTPException(400, "Insufficient balance")

        data = calc_buy(body.outcome, body.amount, m.pool_yes, m.pool_no)
        shares = data["shares_out"]
        price_avg = data["price_avg"]
        fee = data["fee"]

        current_user.balance -= body.amount
        m.pool_yes = data["new_pool_yes"]
        m.pool_no = data["new_pool_no"]
        m.k_constant = m.pool_yes * m.pool_no
        m.volume += body.amount  # объём в потраченных монетах

        if body.outcome == "yes":
            position.shares_yes += shares
        else:
            position.shares_no += shares
        position.cost_basis += body.amount
        amount_in = body.amount

    else:  # sell
        available = position.shares_yes if body.outcome == "yes" else position.shares_no
        if body.amount > available:
            raise HTTPException(400, "Insufficient shares")

        data = calc_sell(body.outcome, body.amount, m.pool_yes, m.pool_no)
        amount_out = data["amount_out"]
        fee = data["fee"]
        price_avg = round(amount_out / body.amount, 6) if body.amount > 0 else 0

        current_user.balance += amount_out
        m.pool_yes = data["new_pool_yes"]
        m.pool_no = data["new_pool_no"]
        m.k_constant = m.pool_yes * m.pool_no
        m.volume += amount_out

        if body.outcome == "yes":
            position.shares_yes -= body.amount
        else:
            position.shares_no -= body.amount

        # Пропорциональное уменьшение cost_basis
        cost_reduction = (body.amount / available) * position.cost_basis if available > 0 else 0
        position.cost_basis = max(0.0, position.cost_basis - cost_reduction)

        # P&L реализован при продаже
        pnl = amount_out - cost_reduction
        current_user.total_pnl += pnl
        shares = body.amount
        amount_in = amount_out

    trade = Trade(
        user_id=current_user.id,
        market_id=market_id,
        outcome=body.outcome,
        action=body.action,
        shares=shares,
        price_avg=price_avg,
        amount_in=amount_in,
        fee=fee,
    )
    db.add(trade)

    prices = get_prices(m.pool_yes, m.pool_no)
    db.add(PriceHistory(market_id=market_id, price_yes=prices["yes"], volume=m.volume))

    await db.commit()
    await db.refresh(trade)
    await db.refresh(current_user)

    return TradeOut(
        id=trade.id,
        outcome=trade.outcome,
        action=trade.action,
        shares=trade.shares,
        price_avg=trade.price_avg,
        amount_in=trade.amount_in,
        fee=trade.fee,
        created_at=trade.created_at,
        new_balance=current_user.balance,
        new_price_yes=prices["yes"],
        new_price_no=prices["no"],
    )
