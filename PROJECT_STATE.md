# PROJECT STATE — Malkhirn

> Последнее обновление: 2026-03-03 (v0.3.0)

---

## Деплой

| Компонент | URL | Хостинг |
|---|---|---|
| Frontend | https://frontend-seven-iota-91.vercel.app | Vercel |
| Backend | https://malkhirn-backend.onrender.com | Render (free tier) |
| GitHub | https://github.com/severaxz/malkhirn-.git | — |

- Frontend: `vercel deploy --prod` из папки `frontend/`
- Backend: автодеплой с GitHub push на `master`
- Render free tier: засыпает после 15 мин неактивности, cold start ~30 сек

---

## Что реализовано

### Backend

#### Аутентификация (`auth.py`)
- Валидация Telegram WebApp `initData` через HMAC-SHA256
- Автосоздание пользователя при первом входе (баланс 0.0 TON)
- Заголовок `X-Init-Data` — обязателен

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
- `POST /markets/{id}/resolve` — резолв с выплатой позиций + push-уведомления

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
- `POST /payments/withdraw` — создать заявку на вывод (мин. 0.5 TON, баланс списывается сразу)
- `GET /payments/withdrawals` — история заявок на вывод (последние 20)

#### TON мониторинг (`main.py`)
- Фоновая задача `poll_ton_deposits()` — каждые 30 секунд
- Запросы к TonCenter API v2 (`getTransactions`)
- Матчинг входящих транзакций по `in_msg.source` → `ton_wallet_address`
- Защита от двойного зачисления через уникальный `tx_hash`
- Минимальный депозит: 0.1 TON
- **Требует**: переменная `TON_WALLET_ADDRESS` на Render

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
| `withdrawal_requests` | user_id, amount_ton, to_address, status, note | Заявки на вывод |

---

### Frontend

#### Страницы
| Страница | Статус | Описание |
|---|---|---|
| `Home.tsx` | ✅ | Лента рынков, фильтры по категории |
| `Market.tsx` | ✅ | График Recharts + TradePanel |
| `Portfolio.tsx` | ✅ | Открытые позиции + история |
| `Leaderboard.tsx` | ✅ | Топ трейдеров |
| `Profile.tsx` | ✅ | Профиль + пополнение + вывод TON |
| `Admin.tsx` | ✅ | Создание рынка + список с резолвом |

#### Компоненты
- `Layout.tsx` — хедер (баланс в TON) + bottom navigation + `AnimatePresence mode="sync"`
- `MarketCard.tsx` — карточка рынка в ленте
- `PriceChart.tsx` — Recharts LineChart
- `TradePanel.tsx` — панель покупки/продажи

#### TON Connect
- `TonConnectUIProvider` обёртывает всё приложение
- Манифест: `frontend/public/tonconnect-manifest.json` (статический URL на Vercel)
- Различает `activeWallet` (живая сессия) vs `walletAddress` (сохранённый адрес из бэкенда)
- Депозит через `tonConnectUI.sendTransaction()` — только при активной сессии
- Если сессия истекла — показывает "Переподключить кошелёк"

#### Дизайн (v0.3.0)
- **Палитра**: чёрно-красная ("бычья кровь")
  - Акцент: `#C41E1E`, hover `#D42828`
  - Градиент: `linear-gradient(135deg, #8B0000, #C41E1E)`
  - Фон: `#09090A`
- **Liquid Glass**: `.glass` (хедер/нав), `.glass-sheet` (шторки/модалки), `.glass-card` (карточки)
- Все модалки рендерятся через `createPortal` в `document.body`
- `AnimatePresence` всегда ВНУТРИ `createPortal` (иначе застревает невидимый overlay)

---

## Конфигурация

### Backend (Render Environment Variables)

```env
BOT_TOKEN=...                    # Токен бота
ADMIN_IDS=624192445              # Telegram ID администраторов
TON_WALLET_ADDRESS=...           # Адрес для приёма TON (ОБЯЗАТЕЛЬНО для работы депозитов)
ALLOWED_ORIGINS=https://frontend-seven-iota-91.vercel.app
VITE_API_URL=...                 # (не нужен бэкенду, только фронтенду)
```

### Frontend (Vercel Environment Variables)

```env
VITE_API_URL=https://malkhirn-backend.onrender.com
```

---

## Текущие ограничения

### Техн. долг
- **Нет Alembic** — при изменении схемы нужно удалять БД вручную
- **SQLite** — не масштабируется; при нагрузке нужен PostgreSQL
- **Float** для денег — правильнее Decimal, но для MVP допустимо
- **Нет rate limiting** — можно спамить API
- **TonCenter free API** — лимит запросов, нет webhook
- **Render free tier** — cold start ~30 сек, SQLite теряется при рестарте

### Функциональные ограничения
- Рынки создаёт только admin вручную — нет UGC
- Вывод средств — заявка создаётся автоматически, но обработка пока ручная
- Push-уведомления только при резолве
- Нет автоматического резолва по дате
