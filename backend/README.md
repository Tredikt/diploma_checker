# Diasoft Diploma Verification Backend

## Назначение

`backend/` - это FastAPI-сервис, который отвечает за регистрацию и аутентификацию пользователей, ведение реестра дипломов, студенческие токены доступа, HR-проверку дипломов и инфраструктурные функции вроде CORS, ошибок, Redis и подключения к БД.

## Технологический стек

- `Python 3.11+`
- `FastAPI`
- `Uvicorn`
- `SQLAlchemy 2`
- `Alembic`
- `PostgreSQL`
- `Redis`
- `Pydantic Settings`
- `PyJWT`
- `passlib[bcrypt]`
- `cryptography`
- `structlog`
- `pytest`, `pytest-asyncio`, `httpx`, `mypy`, `ruff`
- package manager: `uv`

## Как запустить backend

### Локально через uv

1. Перейдите в директорию сервиса:

```bash
cd backend
```

2. Создайте локальный env-файл:

```bash
cp .env.example .env
```

3. Установите зависимости:

```bash
uv sync
```

4. Поднимите PostgreSQL и Redis любым удобным способом, затем выполните миграции:

```bash
uv run alembic upgrade head
```

5. Запустите API:

```bash
uv run uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

### Через Docker Compose

В директории уже есть compose-конфигурация для локальной инфраструктуры:

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Этот сценарий поднимает:

- `postgres`
- `redis`
- `migrate` для `alembic upgrade head`
- `api` с запуском `uvicorn`

## Настройка окружения

Основа конфигурации находится в `backend/.env.example`. Ключевые переменные:

- `HOST`, `PORT`
- `DATABASE_URL`, `DATABASE_POOL_SIZE`
- `REDIS_URL`
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `AES_ENCRYPTION_KEY`, `HMAC_SECRET_KEY`
- `CORS_ORIGINS`
- `PUBLIC_RATE_LIMIT_PER_MINUTE`, `B2B_RATE_LIMIT_PER_MINUTE`

Для локальной разработки убедитесь, что:

- `DATABASE_URL` указывает на доступный PostgreSQL;
- `REDIS_URL` указывает на доступный Redis;
- `CORS_ORIGINS` содержит адрес frontend dev server, если frontend запускается отдельно.

## Структура backend

### Основные директории

- `app/app.py` - создание FastAPI-приложения, регистрация роутеров, middleware и OpenAPI.
- `app/config.py` - загрузка и валидация настроек через Pydantic Settings.
- `app/shared/` - инфраструктурный слой: база данных, Redis, middleware, общие ошибки, JWT и утилиты.
- `app/modules/auth/` - регистрация, логин, refresh, профиль, API-ключи компании и лимиты.
- `app/modules/university/` - кабинет ВУЗа, реестр дипломов, импорт CSV/XLSX, просмотр деталей, аннулирование.
- `app/modules/student/` - список дипломов студента, токены доступа, QR-коды, отзыв токенов.
- `app/modules/hr/` - публичная и авторизованная проверка дипломов, ручной поиск для HR.
- `migrations/` - миграции Alembic.
- `tests/` - backend-тесты.
- `specs/` - технические спецификации и API-контракты.

### Архитектурный паттерн

Сервис построен как модульный монолит:

- роутеры принимают HTTP-запросы и собирают зависимости;
- сервисы инкапсулируют бизнес-логику;
- репозитории работают с БД;
- `shared/` содержит общую инфраструктуру и cross-cutting concerns.

## Request flow

Типовой запрос проходит через такие этапы:

1. Запрос приходит в FastAPI-приложение из `app/app.py`.
2. Для него применяются middleware, включая CORS, request context и обработку исключений.
3. Роутер нужного модуля принимает запрос и разрешает зависимости через DI.
4. Service layer выполняет бизнес-логику.
5. Repository layer читает или изменяет данные в PostgreSQL.
6. Redis используется для refresh-токенов, rate limiting, квот и отдельных cache-first сценариев.
7. Ответ возвращается как typed schema, а ошибки приводятся к единому JSON-формату.

## Основные API-группы

### `auth`

- регистрация для `university`, `company`, `student`
- логин и refresh-сессии
- профиль текущего пользователя
- API-ключи компаний
- лимиты и квоты компании

### `university`

- создание диплома вручную
- импорт CSV/XLSX реестра
- список дипломов
- детальная карточка по `verification_hash`
- аннулирование диплома

### `student`

- список дипломов текущего студента
- просмотр деталей диплома
- создание токена доступа
- список токенов
- генерация QR-кода
- отзыв токена

### `hr`

- `GET /api/v1/hr/verify/{token}` для публичной проверки по ссылке или QR
- `POST /api/v1/hr/search` для внутреннего HR-поиска

## Тестирование и quality gates

```bash
uv run pytest
uv run ruff check .
uv run mypy app
```

Дополнительно перед релизом полезно проверить миграции и реальный запуск через Docker Compose.

## Как пользоваться backend

### Пример локального сценария

1. ВУЗ создает записи дипломов через `/api/v1/university/...`
2. Студент работает со своими дипломами и токенами через `/api/v1/student/...`
3. HR выполняет ручной поиск через `/api/v1/hr/search`
4. Публичная ссылка ведет на `/api/v1/hr/verify/{token}`

OpenAPI строится внутри приложения, а в репозитории также лежат дополнительные спецификации и экспортированные схемы в `specs/` и `frontend/docs/openapi*.json`.

## Команда

- Иван Ткачев - Team Lead
- Степан Кузьменко - Backend Developer
- Владислав Петлюк - Fullstack Developer

## Demo и ссылки

- `API demo`: placeholder, будет добавлено позже
- `OpenAPI screenshots`: placeholder, будут добавлены позже
- `Deploy link`: placeholder, будет добавлена позже

