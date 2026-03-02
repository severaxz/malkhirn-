from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import User
from app.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).order_by(desc(User.total_pnl)).limit(50)
    )
    users = result.scalars().all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            telegram_id=u.telegram_id,
            username=u.username,
            first_name=u.first_name,
            total_pnl=round(u.total_pnl, 2),
            balance=round(u.balance, 2),
        )
        for i, u in enumerate(users)
    ]
