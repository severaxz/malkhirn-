from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models import User, TonDeposit, WithdrawalRequest
from app.config import TON_WALLET_ADDRESS, MIN_DEPOSIT_TON
from app.ton_utils import normalize_address

router = APIRouter(prefix="/payments", tags=["payments"])

MIN_WITHDRAW_TON = 0.5


class WalletRequest(BaseModel):
    address: str


class WalletResponse(BaseModel):
    ton_wallet_address: str | None
    app_wallet: str
    min_deposit: float


class WithdrawRequest(BaseModel):
    amount: float


@router.get("/info", response_model=WalletResponse)
async def payment_info(current_user: User = Depends(get_current_user)):
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
    address = req.address.strip()
    if not address:
        raise HTTPException(400, "Некорректный адрес")

    # Нормализуем к raw формату для единообразного хранения
    address = normalize_address(address)

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


@router.post("/withdraw")
async def request_withdrawal(
    data: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создаёт заявку на вывод TON. Баланс резервируется немедленно."""
    if not current_user.ton_wallet_address:
        raise HTTPException(400, "Сначала подключи TON-кошелёк")
    if data.amount < MIN_WITHDRAW_TON:
        raise HTTPException(400, f"Минимальная сумма вывода: {MIN_WITHDRAW_TON} TON")
    if data.amount > current_user.balance:
        raise HTTPException(400, "Недостаточно средств на балансе")

    current_user.balance -= data.amount
    wr = WithdrawalRequest(
        user_id=current_user.id,
        amount_ton=data.amount,
        to_address=current_user.ton_wallet_address,
        status="pending",
    )
    db.add(wr)
    await db.commit()
    await db.refresh(wr)
    return {
        "id": wr.id,
        "amount_ton": wr.amount_ton,
        "to_address": wr.to_address,
        "status": wr.status,
        "created_at": wr.created_at.isoformat(),
        "note": wr.note,
    }


@router.get("/withdrawals")
async def get_withdrawals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WithdrawalRequest)
        .where(WithdrawalRequest.user_id == current_user.id)
        .order_by(WithdrawalRequest.created_at.desc())
        .limit(20)
    )
    items = result.scalars().all()
    return [
        {
            "id": w.id,
            "amount_ton": w.amount_ton,
            "to_address": w.to_address,
            "status": w.status,
            "created_at": w.created_at.isoformat(),
            "note": w.note,
        }
        for w in items
    ]
