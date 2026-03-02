from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models import User, TonDeposit
from app.config import TON_WALLET_ADDRESS, MIN_DEPOSIT_TON

router = APIRouter(prefix="/payments", tags=["payments"])


class WalletRequest(BaseModel):
    address: str  # TON wallet address пользователя


class WalletResponse(BaseModel):
    ton_wallet_address: str | None
    app_wallet: str
    min_deposit: float


@router.get("/info", response_model=WalletResponse)
async def payment_info(current_user: User = Depends(get_current_user)):
    """Возвращает адрес кошелька приложения и минимальный депозит."""
    return WalletResponse(
        ton_wallet_address=current_user.ton_wallet_address,
        app_wallet=TON_WALLET_ADDRESS,
        min_deposit=MIN_DEPOSIT_TON,
    )


@router.post("/wallet")
async def save_wallet(
    req: WalletRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сохраняет TON-адрес пользователя для отслеживания депозитов."""
    address = req.address.strip()
    if not address:
        raise HTTPException(400, "Некорректный адрес")

    # Проверяем, не занят ли адрес другим пользователем
    existing = await db.execute(
        select(User).where(
            User.ton_wallet_address == address,
            User.id != current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Адрес уже привязан к другому аккаунту")

    current_user.ton_wallet_address = address
    await db.commit()
    return {"ok": True}


@router.get("/deposits")
async def get_deposits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """История TON-депозитов пользователя."""
    result = await db.execute(
        select(TonDeposit)
        .where(TonDeposit.user_id == current_user.id)
        .order_by(TonDeposit.created_at.desc())
        .limit(20)
    )
    deposits = result.scalars().all()
    return [
        {
            "tx_hash": d.tx_hash,
            "amount_ton": d.amount_ton,
            "created_at": d.created_at.isoformat(),
        }
        for d in deposits
    ]
