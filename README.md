# Malkhirn — Prediction Markets Telegram Mini App

Аналог Polymarket для Telegram: торговля на исходах реальных событий за TON.
Цена формируется алгоритмически через CPMM AMM — как на настоящем рынке.

---

## Стек технологий

**Backend:** Python · FastAPI · SQLite (aiosqlite) · SQLAlchemy async · aiogram 3.x · httpx
**Frontend:** React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · Recharts · @tonconnect/ui-react
**Auth:** Telegram WebApp initData (HMAC-SHA256)
**Платежи:** TON Connect + мониторинг TonCenter API

---

## Структура проекта

```
predict-app/
├── backend/
│   ├── .env                  # Секреты (BOT_TOKEN, ADMIN_IDS, TON_WALLET_ADDRESS)
│   ├── requirements.txt
│   ├── bot.py                # Telegram бот — /start с кнопкой Mini App
│   └── app/
│       ├── main.py           # FastAPI app + фоновый TON polling (30s)
│       ├── config.py         # Конфиг из .env
│       ├── database.py       # SQLAlchemy async engine
│       ├── models.py         # ORM: User, Market, Position, Trade, PriceHistory, TonDeposit
│       ├── schemas.py        # Pydantic схемы
│       ├── auth.py           # Валидация Telegram initData
│       ├── amm.py            # CPMM AMM: calc_buy, calc_sell, calc_resolution_payout
│       └── routers/
│           ├── markets.py    # GET/POST /markets, POST /markets/{id}/resolve
│           ├── trades.py     # GET /markets/{id}/preview, POST /markets/{id}/trade
│           ├── users.py      # GET /users/me, GET /users/me/portfolio
│           ├── leaderboard.py
│           └── payments.py   # GET /payments/info, POST /payments/wallet, GET /payments/deposits
│
└── frontend/
    ├── public/
    │   └── tonconnect-manifest.json   # ← обновлять при смене URL
    └── src/
        ├── lib/
        │   ├── api.ts         # Все API вызовы
        │   ├── amm.ts         # Клиентский предрасчёт AMM
        │   └── telegram.ts    # WebApp SDK helpers
        ├── pages/
        │   ├── Home.tsx       # Лента рынков с фильтрами
        │   ├── Market.tsx     # График + торговая панель
        │   ├── Portfolio.tsx  # Открытые позиции + история
        │   ├── Leaderboard.tsx
        │   ├── Profile.tsx    # Профиль + TON депозит
        │   └── Admin.tsx      # Создание и резолв рынков
        └── components/
            ├── Layout.tsx     # Хедер + нижняя навигация
            ├── MarketCard.tsx
            ├── PriceChart.tsx
            └── TradePanel.tsx
```

---

## Как запустить

### 1. Backend

```bash
cd backend

# Установить зависимости
python -m pip install -r requirements.txt

# Заполнить .env (файл уже создан)
# TON_WALLET_ADDRESS — обязательно для приёма депозитов

# Запустить API
python -m uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs

# Бот (в отдельном терминале)
python bot.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173

# Туннель для Telegram
ngrok http 5173
```

### 3. После получения ngrok URL — обновить в двух файлах:

- `frontend/public/tonconnect-manifest.json` → поле `"url"`
- `backend/bot.py` → переменная `WEBAPP_URL`

### 4. backend/.env

```env
BOT_TOKEN=<токен от @BotFather>
ADMIN_IDS=<telegram_id через запятую>
TON_WALLET_ADDRESS=<TON адрес приложения>
```

---

## AMM механика (CPMM)

```
k = pool_yes × pool_no

price_yes = pool_no / (pool_yes + pool_no)
price_no  = pool_yes / (pool_yes + pool_no)

Покупка YES на сумму X:
  fee           = X × 0.02
  new_pool_no  += X - fee
  new_pool_yes  = k / new_pool_no
  shares_out    = old_pool_yes - new_pool_yes

Выплата при резолве: 1 TON за 1 winning share
```

---

## Дизайн

- Фон: `#080B14` / Карточки: `#0F1320`
- Акцент: Purple `#8B5CF6` → `#A855F7`
- YES: Green `#22C55E` / NO: Red `#EF4444`
