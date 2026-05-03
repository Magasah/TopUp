# donater-bot

Telegram-бот для продажи донатов (Free Fire, PUBG Mobile): **Grammy** + **better-sqlite3** + i18n RU/TJ.

## Установка

```bash
cd donater-bot
cp .env.example .env
# Укажите BOT_TOKEN, ADMIN_IDS, CHANNEL_ID, REVIEWS_CHANNEL, реквизиты DC/Alif/MasterCard
npm install
node index.js
```

**Windows:** для сборки `better-sqlite3` нужны [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (workload «Desktop development with C++») **или** используйте WSL/Linux, **или** Node LTS с готовыми prebuild для `better-sqlite3`.

## Структура

См. каталоги `handlers/`, `middlewares/`, `utils/`, `locales/`, `database/`. Точка входа: `index.js`.

## Checklist проверки

- [ ] `.env` заполнен, бот запущен без ошибок
- [ ] /start: подписка на канал, главное меню, смена языка
- [ ] Выбор игры → товары → капча → ID → подтверждение → оплата → фото чека
- [ ] Админ получает заказ с кнопками; принятие/отклонение уведомляет пользователя
- [ ] /otziv → текст → модерация админом → публикация в `REVIEWS_CHANNEL`
- [ ] /admin (только ADMIN_IDS): статистика, заказы, товары, игры, рассылка

## Ассеты (фото)

По умолчанию ищутся файлы в `public/`:

| Файл | Где используется |
|------|------------------|
| `public/старт.jpg` | Приветствие, экран подписки |
| `public/товарь Free Fire.jpg` | Обложка каталога Free Fire |
| `public/PUBG Mobile товарь.jpg` | Обложка каталога PUBG |
| `public/store.jpg` или `assets/store.jpg` | Настройки |

Переопределение: переменные `START_PHOTO_PATH`, `GAME_COVER_FF`, `GAME_COVER_PUBG`, `STORE_PHOTO_PATH` в `.env`.
