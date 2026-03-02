from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Market, PriceHistory
from app.schemas import MarketOut, MarketDetailOut, MarketCreateRequest, MarketResolveRequest, PriceHistoryPoint
from app.amm import get_prices, calc_resolution_payout
from app.auth import get_current_user
from app.models import User, Position

from app.config import ADMIN_IDS, BOT_TOKEN
from aiogram import Bot

router = APIRouter(prefix="/markets", tags=["markets"])


def market_to_out(m: Market) -> dict:
    prices = get_prices(m.pool_yes, m.pool_no)
    return {
        **{c.name: getattr(m, c.name) for c in m.__table__.columns},
        "price_yes": prices["yes"],
        "price_no": prices["no"],
    }


@router.get("", response_model=list[MarketOut])
async def list_markets(
    category: Optional[str] = Query(None),
    status: str = Query("active"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Market).where(Market.status == status).order_by(desc(Market.volume))
    if category and category != "All":
        q = q.where(Market.category == category)
    result = await db.execute(q)
    markets = result.scalars().all()
    return [market_to_out(m) for m in markets]


@router.get("/{market_id}", response_model=MarketDetailOut)
async def get_market(market_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Market).where(Market.id == market_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Market not found")

    hist_result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.market_id == market_id)
        .order_by(PriceHistory.timestamp)
        .limit(200)
    )
    history = hist_result.scalars().all()

    data = market_to_out(m)
    data["price_history"] = [
        PriceHistoryPoint(price_yes=h.price_yes, volume=h.volume, timestamp=h.timestamp)
        for h in history
    ]
    return data


@router.post("", response_model=MarketOut)
async def create_market(
    body: MarketCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.telegram_id not in ADMIN_IDS:
        raise HTTPException(403, "Admin only")

    liq = body.initial_liquidity
    m = Market(
        question=body.question,
        description=body.description,
        category=body.category,
        end_date=body.end_date,
        pool_yes=liq,
        pool_no=liq,
        k_constant=liq * liq,
        created_by=current_user.telegram_id,
    )
    db.add(m)
    await db.flush()

    # Начальная точка истории
    db.add(PriceHistory(market_id=m.id, price_yes=0.5, volume=0.0))
    await db.commit()
    await db.refresh(m)
    return market_to_out(m)


@router.post("/{market_id}/resolve", response_model=MarketOut)
async def resolve_market(
    market_id: int,
    body: MarketResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.telegram_id not in ADMIN_IDS:
        raise HTTPException(403, "Admin only")

    result = await db.execute(select(Market).where(Market.id == market_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Market not found")
    if m.status != "active":
        raise HTTPException(400, "Market already resolved")

    m.status = "resolved"
    m.resolution = body.resolution

    # Выплатить позиции
    pos_result = await db.execute(
        select(Position).where(Position.market_id == market_id)
    )
    positions = pos_result.scalars().all()
    notifications = []  # (telegram_id, payout, pnl)
    for pos in positions:
        user_res = await db.execute(select(User).where(User.id == pos.user_id))
        user = user_res.scalar_one_or_none()
        if user:
            payout = calc_resolution_payout(pos.shares_yes, body.resolution, "yes")
            payout += calc_resolution_payout(pos.shares_no, body.resolution, "no")
            cost = pos.cost_basis
            pnl = payout - cost
            if payout > 0:
                user.balance += payout
                user.total_pnl += pnl
            pos.shares_yes = 0
            pos.shares_no = 0
            notifications.append((user.telegram_id, payout, pnl))

    await db.commit()
    await db.refresh(m)

    # Push-уведомления участникам
    if notifications:
        res_emoji = "✅" if m.resolution == "yes" else "❌"
        bot = Bot(token=BOT_TOKEN)
        try:
            for tg_id, payout, pnl in notifications:
                sign = "+" if pnl >= 0 else ""
                if payout > 0:
                    text = (
                        f"🏆 <b>Рынок завершён!</b>\n\n"
                        f"📋 {m.question}\n\n"
                        f"Результат: {res_emoji} <b>{m.resolution.upper()}</b>\n"
                        f"Выплата: <b>+{payout:.1f} 🪙</b>\n"
                        f"P&L: <b>{sign}{pnl:.1f} 🪙</b>"
                    )
                else:
                    text = (
                        f"📋 <b>Рынок завершён</b>\n\n"
                        f"{m.question}\n\n"
                        f"Результат: {res_emoji} <b>{m.resolution.upper()}</b>\n"
                        f"Ваша ставка не сыграла 😔\n"
                        f"P&L: <b>{pnl:.1f} 🪙</b>"
                    )
                try:
                    await bot.send_message(tg_id, text, parse_mode="HTML")
                except Exception:
                    pass  # пользователь мог заблокировать бота
        finally:
            await bot.session.close()

    return market_to_out(m)
