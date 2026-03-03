import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, SessionLocal
from app.routers import markets, trades, users, leaderboard, payments
from app.config import TON_WALLET_ADDRESS, TONCENTER_URL, TON_NANOTON, APP_NAME, ALLOWED_ORIGINS

logger = logging.getLogger(__name__)


async def poll_ton_deposits():
    """Фоновая задача: мониторит TON-транзакции на кошелёк приложения каждые 30 секунд."""
    import httpx
    from sqlalchemy import select
    from app.models import User, TonDeposit
    from app.ton_utils import normalize_address

    if not TON_WALLET_ADDRESS:
        logger.info("TON_WALLET_ADDRESS не задан — мониторинг депозитов отключён")
        return

    logger.info(f"Запуск мониторинга TON-депозитов на адрес {TON_WALLET_ADDRESS}")

    while True:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{TONCENTER_URL}/getTransactions",
                    params={"address": TON_WALLET_ADDRESS, "limit": 20, "archival": "false"},
                )
                if resp.status_code != 200:
                    await asyncio.sleep(30)
                    continue

                txs = resp.json().get("result", [])

                async with SessionLocal() as db:
                    # Загружаем всех пользователей с кошельками и нормализуем адреса
                    wallet_users = (await db.execute(
                        select(User).where(User.ton_wallet_address.isnot(None))
                    )).scalars().all()
                    addr_to_user = {
                        normalize_address(u.ton_wallet_address): u
                        for u in wallet_users if u.ton_wallet_address
                    }

                    for tx in txs:
                        tx_hash = tx.get("transaction_id", {}).get("hash", "")
                        in_msg = tx.get("in_msg", {})
                        value_nano = int(in_msg.get("value", 0))
                        from_addr = in_msg.get("source", "")

                        if not tx_hash or value_nano <= 0 or not from_addr:
                            continue

                        # Защита от двойного зачисления
                        existing = await db.execute(
                            select(TonDeposit).where(TonDeposit.tx_hash == tx_hash)
                        )
                        if existing.scalar_one_or_none():
                            continue

                        # Найти пользователя по нормализованному адресу
                        from_raw = normalize_address(from_addr)
                        user = addr_to_user.get(from_raw)
                        if not user:
                            continue

                        # Начислить баланс (1 TON = 1 единица)
                        amount_ton = value_nano / TON_NANOTON
                        if amount_ton < 0.01:
                            continue  # слишком маленький перевод (сетевые комиссии)

                        user.balance += amount_ton

                        deposit = TonDeposit(
                            tx_hash=tx_hash,
                            user_id=user.id,
                            amount_ton=amount_ton,
                            from_address=from_addr,
                        )
                        db.add(deposit)
                        await db.commit()
                        logger.info(f"Депозит {amount_ton} TON → user_id={user.id}")

        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.warning(f"Ошибка мониторинга TON: {e}")

        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(poll_ton_deposits())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title=f"{APP_NAME} API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(markets.router)
app.include_router(trades.router)
app.include_router(users.router)
app.include_router(leaderboard.router)
app.include_router(payments.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": APP_NAME}
