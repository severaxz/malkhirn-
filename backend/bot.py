import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from app.config import BOT_TOKEN, APP_NAME

WEBAPP_URL = "https://unluminescent-delinda-exemptible.ngrok-free.dev"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text=f"🔮 Открыть {APP_NAME}",
            web_app=WebAppInfo(url=WEBAPP_URL),
        )
    ]])
    await message.answer(
        f"👋 Добро пожаловать в <b>{APP_NAME}</b>!\n\n"
        "Торгуй на исходах реальных событий за TON.\n"
        "Цена формируется спросом — как на настоящем рынке.\n\n"
        "💎 Пополни баланс через TON и начни торговать!",
        parse_mode="HTML",
        reply_markup=kb,
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
