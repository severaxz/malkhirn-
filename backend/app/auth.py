import hashlib
import hmac
import json
from urllib.parse import parse_qsl, unquote
from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.config import BOT_TOKEN


def validate_init_data(init_data: str) -> dict:
    """Валидация Telegram WebApp initData через HMAC-SHA256."""
    parsed = dict(parse_qsl(unquote(init_data), keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash")

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Invalid hash")

    user_data = json.loads(parsed.get("user", "{}"))
    return user_data


async def get_current_user(
    x_init_data: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not x_init_data:
        raise HTTPException(status_code=401, detail="Missing Telegram auth")

    try:
        user_data = validate_init_data(x_init_data)
        telegram_id = user_data["id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth")

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=telegram_id,
            username=user_data.get("username"),
            first_name=user_data.get("first_name"),
            balance=0.0,  # реальный баланс — только через TON-депозит
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
