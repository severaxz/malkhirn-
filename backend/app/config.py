import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "Malkhirn"

ADMIN_IDS: set[int] = {
    int(x) for x in os.environ.get("ADMIN_IDS", "624192445").split(",") if x.strip()
}

BOT_TOKEN = os.environ.get(
    "BOT_TOKEN", "8752870407:AAFFpTJHQxfXk-P47y_fkDrqPahHDJ1OHSE"
)

# TON Connect / Deposits
# Адрес TON-кошелька приложения (куда пользователи отправляют TON)
TON_WALLET_ADDRESS = os.environ.get("TON_WALLET_ADDRESS", "")
TONCENTER_URL = "https://toncenter.com/api/v2"

# CORS: разрешённые origins (разделены запятой в .env)
ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]
TON_NANOTON = 1_000_000_000  # 1 TON = 10^9 nanotons
MIN_DEPOSIT_TON = 0.1         # минимальный депозит в TON
