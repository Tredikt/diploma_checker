# Diasoft Diploma Verification Frontend

## Назначение

`frontend/` - это role-based веб-приложение для трех аудиторий:

- `ВУЗ` работает с реестром дипломов;
- `Студент` просматривает свои дипломы и управляет токенами доступа;
- `HR / компания` проверяет дипломы вручную, через публичные ссылки и через API-интеграции.

Frontend отвечает за маршрутизацию сценариев, отображение состояний интерфейса, работу с backend API и единый UX для всех ролей.

## Технологический стек

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `@tanstack/react-query`
- `Zustand`
- `react-hook-form`
- `zod`
- `Tailwind CSS v4`
- `Vitest`
- `Testing Library`

## Как запустить frontend

1. Перейдите в директорию приложения:

```bash
cd frontend
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите dev server:

```bash
npm run dev
```

4. Для production-сборки:

```bash
npm run build
```

5. Для локального предпросмотра production-сборки:

```bash
npm run preview
```

## Подключение к backend API

Базовый URL задается в `src/shared/api/http-client.ts`:

- через `VITE_API_BASE_URL`
- или через fallback `http://localhost:8000/api/v1`

Дополнительно Vite настроен на proxy:

- `'/api' -> http://localhost:8000`

Это означает, что для локальной разработки важно синхронизировать frontend и backend по портам и CORS-настройкам.

Рекомендуемый локальный сценарий:

- backend работает на `http://localhost:8000`
- frontend работает на `http://localhost:5173`
- backend `CORS_ORIGINS` включает `http://localhost:5173`

## Команды разработки и проверки

```bash
npm run dev
npm run test
npm run typecheck
npm run build
```

## Структура frontend

### Ключевые директории

- `src/main.tsx` - точка входа React-приложения.
- `src/app/` - bootstrap, providers, layouts, router, store.
- `src/features/` - API-адаптеры и feature-level модели по доменам.
- `src/pages/` - страницы и screen-level сценарии.
- `src/shared/` - общие типы, API-клиент, дизайн-токены, UI-компоненты и utility-слой.
- `src/widgets/` - составные элементы интерфейса вроде shell и навигации.
- `tests/` - unit-тесты и тестовая настройка.
- `docs/` - продуктовые документы и экспортированные OpenAPI-файлы.

### Что за что отвечает

- `app/router/router.tsx` - центральное описание маршрутов и role-based access.
- `app/bootstrap/useAuthBootstrap.ts` - восстановление сессии через refresh flow.
- `shared/api/http-client.ts` - базовый HTTP-клиент, обработка ошибок и bearer auth.
- `shared/config/navigation.ts` - role-based навигация по приложению.

## Маршрутизация и UX по ролям

Маршрутизация построена через `createBrowserRouter` и разделяет публичный и защищенный контуры.

### Публичные маршруты

- `/auth/login`
- `/auth/register/:role`
- `/auth/registration-complete`
- `/auth/pending-review`
- `/verify/:token?`

### Защищенный контур

- `/app/university/...`
- `/app/company/...`
- `/app/student/...`

Доступ управляется через:

- `RouteGuard` для проверки авторизации;
- `RoleRoute` для проверки роли;
- `AppHomeRedirect` для корректного входа в домашний маршрут после логина.

## Основные пользовательские сценарии

### Auth

- логин по email и password;
- регистрация отдельными формами под роль;
- bootstrap сессии через refresh endpoint;
- экран ожидания подтверждения для ролей, которым нужна ручная верификация.

### Public verification

- открытие страницы `/verify/:token`;
- запрос результата проверки через `GET /api/v1/hr/verify/{token}`;
- показ безопасного публичного результата с ограничением персональных данных.

### University flow

- реестр дипломов;
- импорт CSV/XLSX;
- ручное создание записи;
- детальная карточка диплома;
- аннулирование записи.

### Company / HR flow

- ручная проверка диплома;
- история последней успешной проверки в сессии;
- управление API-ключами;
- просмотр лимитов компании.

### Student flow

- список дипломов;
- карточка диплома;
- выпуск токенов доступа;
- просмотр списка токенов;
- генерация и просмотр QR-кода;
- отзыв токенов.

## Как пользоваться приложением

### Пример сценария для ВУЗа

1. Зарегистрировать университетский аккаунт.
2. Дождаться подтверждения и войти в систему.
3. Загрузить дипломы через импорт или создать запись вручную.
4. Перейти в карточку диплома по `verification_hash`.

### Пример сценария для студента

1. Войти в кабинет студента.
2. Открыть список дипломов.
3. Выпустить токен доступа.
4. Открыть QR-страницу и передать ее работодателю.

### Пример сценария для HR

1. Войти в кабинет компании.
2. Открыть ручную проверку.
3. Ввести код ВУЗа и номер диплома.
4. Получить полный результат проверки.

## Скриншоты

### ВУЗ

| Экран | Скрин |
|---|---|
| Вход | ![ВУЗ login](demo/university/login.png) |
| Регистрация | ![ВУЗ register](demo/university/register.png) |
| Реестр | ![ВУЗ diploms](demo/university/diploms.png) |
| Импорт | ![ВУЗ import](demo/university/import.png) |
| Создание | ![ВУЗ create](demo/university/create.png) |
| Карточка диплома | ![ВУЗ diplom](demo/university/diplom.png) |

### Студент

| Экран | Скрин |
|---|---|
| Вход | ![Student login](demo/student/login.png) |
| Реестр/главная | ![Student registry](demo/student/registry.png) |
| Мои дипломы | ![Student diploms](demo/student/diploms.png) |
| Доступы | ![Student access](demo/student/access.png) |
| Карточка диплома | ![Student diplom](demo/student/diplom.png) |

### HR / компания

| Экран | Скрин |
|---|---|
| Вход | ![HR login](demo/hr/login.png) |
| Регистрация | ![HR register](demo/hr/register.png) |
| Проверка | ![HR check](demo/hr/check.png) |
| API-ключи | ![HR keys](demo/hr/keys.png) |
| Лимиты | ![HR limits](demo/hr/limits.png) |

## Тесты

Во frontend уже есть unit-тесты для маршрутов, API-слоя и страниц. Основные команды:

```bash
npm run test
npm run typecheck
npm run build
```

## Команда

- Иван Ткачев - Team Lead
- Степан Кузьменко - Backend Developer
- Владислав Петлюк - Fullstack Developer

## Demo и материалы

- `Frontend demo`: placeholder, ссылка будет добавлена позже
- `Скриншоты интерфейса`: placeholder, будут добавлены позже
- `Видео / screencast`: placeholder, ссылка будет добавлена позже
