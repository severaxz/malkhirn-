# PROJECT STATE — Malkhirn

> Последнее обновление: 2026-03-03

---

## Что реализовано

### Backend

#### Аутентификация (`auth.py`)
- Валидация Telegram WebApp `initData` через HMAC-SHA256
- Автосоздание пользователя при первом входе (баланс 0.0 TON)
- Заголовок `X-Init-Data` — обязателен (dev-bypass удалён)

#### AMM — CPMM (`amm.py`)
- `calc_buy(outcome, amount, pool_yes, pool_no)` — покупка шеров
- `calc_sell(outcome, shares, pool_yes, pool_no)` — продажа шеров
- `calc_resolution_payout(shares, resolution, outcome)` — выплата 1 TON/шер
- `get_prices(pool_yes, pool_no)` — текущие цены YES/NO
- Комиссия 2% на каждую операцию

#### Рынки (`routers/markets.py`)
- `GET /markets` — список с фильтрами по статусу и категории
- `GET /markets/{id}` — детали + история цен (до 200 точек)
- `POST /markets` — создание рынка (только ADMIN_IDS)
- `POST /markets/{id}/resolve` — резолв с выплатой позиций + push-уведомления в Telegram

#### Трейдинг (`routers/trades.py`)
- `GET /markets/{id}/preview` — превью сделки (shares, price, slippage, fee)
- `POST /markets/{id}/trade` — выполнение сделки (buy/sell)
- Минимум: 0.01 TON / Максимум: 100,000 TON
- Обновление `PriceHistory` после каждой сделки

#### Пользователи (`routers/users.py`)
- `GET /users/me` — профиль (баланс, pnl, адрес кошелька)
- `GET /users/me/portfolio` — открытые позиции с текущим P&L

#### Лидерборд (`routers/leaderboard.py`)
- `GET /leaderboard` — топ пользователей по total_pnl

#### Платежи (`routers/payments.py`)
- `GET /payments/info` — адрес кошелька приложения + мин. депозит
- `POST /payments/wallet` — сохранить TON-адрес пользователя
- `GET /payments/deposits` — история депозитов (последние 20)

#### TON мониторинг (`main.py`)
- Фоновая задача `poll_ton_deposits()` — каждые 30 секунд
- Запросы к TonCenter API v2 (`getTransactions`)
- Матчинг входящих транзакций по `in_msg.source` → `ton_wallet_address`
- Защита от двойного зачисления через уникальный `tx_hash`
- Минимальный депозит: 0.1 TON

#### Telegram бот (`bot.py`)
- `/start` → приветственное сообщение + кнопка "Открыть Malkhirn"
- `WebAppInfo` с URL фронтенда

---

### База данных

| Таблица | Поля | Назначение |
|---|---|---|
| `users` | telegram_id, username, balance, total_pnl, ton_wallet_address | Пользователи |
| `markets` | question, category, end_date, status, pool_yes, pool_no, k_constant, volume | Рынки |
| `positions` | user_id, market_id, shares_yes, shares_no, cost_basis | Открытые позиции |
| `trades` | user_id, market_id, outcome, action, shares, price_avg, amount_in, fee | История сделок |
| `price_history` | market_id, price_yes, volume, timestamp | График цен |
| `ton_deposits` | tx_hash (unique), user_id, amount_ton, from_address | Обработанные депозиты |

---

### Frontend

#### Страницы
| Страница | Статус | Описание |
|---|---|---|
| `Home.tsx` | ✅ | Лента рынков, фильтры по категории |
| `Market.tsx` | ✅ | График Recharts + TradePanel |
| `Portfolio.tsx` | ✅ | Открытые позиции + история |
| `Leaderboard.tsx` | ✅ | Топ трейдеров |
| `Profile.tsx` | ✅ | Профиль + TON Connect депозит |
| `Admin.tsx` | ✅ | Создание рынка + список с резолвом |

#### Компоненты
- `Layout.tsx` — хедер (баланс в TON) + bottom navigation
- `MarketCard.tsx` — карточка рынка в ленте
- `PriceChart.tsx` — Recharts LineChart
- `TradePanel.tsx` — панель покупки/продажи

#### TON Connect
- `TonConnectUIProvider` обёртывает всё приложение
- При подключении кошелька → адрес автосохраняется на бэкенд
- Депозит через `tonConnectUI.sendTransaction()`
- После отправки — баланс обновляется через 35 сек

---

## Текущие ограничения

### Техн. долг
- **Нет Alembic** — при изменении схемы нужно удалять БД вручную
- **SQLite** — не масштабируется горизонтально; при нагрузке нужен PostgreSQL
- **Float** для денег — правильнее Decimal, но для MVP допустимо
- **CORS `allow_origins=["*"]`** — ок для dev, нужно ограничить в prod
- **Нет rate limiting** — можно спамить API
- **ngrok URL** захардкожен — нужен постоянный домен для prod

### Функциональные ограничения
- Рынки создаёт только admin вручную — нет UGC
- Нет системы ввода начальной ликвидности из реальных TON
- Push-уведомления только при резолве (не при достижении цены)
- `tonconnect-manifest.json` нужно обновлять при каждой смене ngrok URL
- TonCenter free API — лимит запросов, нет webhook

---

## Конфигурация (backend/.env)

```env
BOT_TOKEN=...              # Токен бота
ADMIN_IDS=624192445        # Telegram ID администраторов
TON_WALLET_ADDRESS=UQC0... # Адрес для приёма TON
```
