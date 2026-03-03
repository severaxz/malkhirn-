# NEXT STEPS — Malkhirn

> Обновлено: 2026-03-03 (v0.3.0)

---

## Выполнено (сегодня)

- [x] ~~Деплой: Frontend → Vercel, Backend → Render~~
- [x] ~~GitHub: код запушен на https://github.com/severaxz/malkhirn-.git~~
- [x] ~~TON Connect: исправлена ошибка манифеста (статический URL)~~
- [x] ~~Кнопка "Пополнить": видна над навбаром (pb-28 + portal)~~
- [x] ~~Модалка депозита: кнопка кликабельна (AnimatePresence внутри portal)~~
- [x] ~~Кошелёк: различие active session vs saved address~~
- [x] ~~Вывод средств: backend + frontend (заявка → ручная обработка)~~
- [x] ~~Дизайн: чёрно-красная палитра (бычья кровь)~~
- [x] ~~Liquid Glass эффект на шторках и навбаре~~
- [x] ~~Пустой экран при переключении вкладок: error state + AnimatePresence sync~~

---

## Приоритет 1 — Нужно сделать сейчас

### 1.1 Настроить TON_WALLET_ADDRESS на Render
- Зайти на Render → Environment → добавить `TON_WALLET_ADDRESS`
- Без этого депозиты НЕ зачисляются на баланс
- **Статус:** ожидает действия от пользователя

### 1.2 Автоматический вывод TON
- Добавить `TON_WALLET_MNEMONIC` как env на Render
- Бэкенд подписывает и отправляет TON автоматически
- Библиотека: `tonsdk` или `pytoniq`
- **Результат:** пользователи получают TON без ручной обработки

### 1.3 Список заявок на вывод в админке
- Добавить в `Admin.tsx` раздел с заявками на вывод
- Статусы: pending → processing → done / cancelled
- Кнопки "Одобрить" / "Отклонить"

### 1.4 Тест полного цикла
- Создать тестовый рынок через `/admin`
- Подключить Tonkeeper / TG Wallet → отправить 0.1 TON
- Убедиться что баланс зачислился (~30 сек)
- Сделать ставку YES/NO → проверить AMM
- Резолвить рынок → проверить выплаты

---

## Приоритет 2 — Качество и стабильность

### 2.1 PostgreSQL вместо SQLite
- Render free tier теряет SQLite при рестарте
- Варианты: Supabase (free), Neon (free), ElephantSQL
- Сменить `DATABASE_URL` на `postgresql+asyncpg://...`

### 2.2 Миграции базы данных (Alembic)
```bash
cd backend && pip install alembic
alembic init alembic
```
- При изменении модели — миграция вместо удаления БД

### 2.3 Rate limiting
```python
# pip install slowapi
# 30 req/min на /trade, 100 req/min на /markets
```

### 2.4 TON webhook вместо polling
- Сейчас: опрос TonCenter каждые 30 сек
- Альтернатива: webhook / собственная нода
- **Результат:** мгновенное зачисление

### 2.5 CORS ограничение
- Установить `ALLOWED_ORIGINS=https://frontend-seven-iota-91.vercel.app` на Render
- Сейчас по умолчанию `*`

---

## Приоритет 3 — Новые фичи

### 3.1 История сделок на странице рынка
- `GET /markets/{id}/trades` — последние сделки
- Показывать в Market.tsx под графиком

### 3.2 Автоматический резолв по дате
- При `end_date < now` → статус `pending_resolution`
- Admin получает уведомление в Telegram

### 3.3 Поиск рынков
- `GET /markets?q=bitcoin` — поиск по тексту
- Поле поиска на Home.tsx

### 3.4 Share рынка
- Кнопка "Поделиться" → `tg.openTelegramLink()` с deep link

### 3.5 Категории рынков в Admin
- Выпадающий список вместо текстового поля

---

## Приоритет 4 — Масштаб и монетизация

### 4.1 Protocol fee
- Часть комиссии (0.5%) на адрес протокола

### 4.2 Уведомления о движении цены
- "YES достигло 80%" → push пользователям с позицией

### 4.3 Реферальная система
- Реферальный код в `/start` → бонус за нового пользователя

### 4.4 TON Jetton поддержка
- Принимать USDT/TON и другие jetton'ы

---

## Техн. долг

| Задача | Файл | Сложность |
|---|---|---|
| Float → Decimal для балансов | models.py, amm.py | Средняя |
| Добавить индексы на Trade.created_at | models.py | Низкая |
| Убрать BOT_TOKEN из git-истории | config.py | Средняя |
| Добавить логирование в trades.py | trades.py | Низкая |
| Пагинация в /leaderboard | leaderboard.py | Низкая |
| Обработка ошибок API на всех страницах (как в Profile) | *.tsx | Средняя |
