from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, Position, Market
from app.schemas import UserOut, PositionOut
from app.auth import get_current_user
from app.amm import get_prices
from app.config import ADMIN_IDS

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    data = {c.name: getattr(current_user, c.name) for c in current_user.__table__.columns}
    data["is_admin"] = current_user.telegram_id in ADMIN_IDS
    return UserOut(**data)


@router.get("/me/portfolio", response_model=list[PositionOut])
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Position, Market)
        .join(Market, Position.market_id == Market.id)
        .where(Position.user_id == current_user.id)
        .where((Position.shares_yes > 0) | (Position.shares_no > 0))
    )
    rows = result.all()

    portfolio = []
    for pos, market in rows:
        prices = get_prices(market.pool_yes, market.pool_no)
        current_value = (
            pos.shares_yes * prices["yes"] + pos.shares_no * prices["no"]
        )
        pnl = current_value - pos.cost_basis

        portfolio.append(
            PositionOut(
                market_id=market.id,
                market_question=market.question,
                market_status=market.status,
                market_end_date=market.end_date,
                market_resolution=market.resolution,
                price_yes=prices["yes"],
                shares_yes=pos.shares_yes,
                shares_no=pos.shares_no,
                cost_basis=pos.cost_basis,
                current_value=round(current_value, 4),
                pnl=round(pnl, 4),
            )
        )
    return portfolio
