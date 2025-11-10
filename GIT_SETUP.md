# Настройка Git репозитория для Super Admin

## Текущее состояние

Super Admin Panel теперь является отдельным Git репозиторием, изолированным от основного проекта Kataloga.

## Локальный репозиторий

Локальный Git репозиторий уже инициализирован:

```bash
cd apps/super-admin
git status
```

Первый коммит уже создан с полным кодом приложения.

## Настройка удаленного репозитория

### Вариант 1: GitHub

1. Создайте новый репозиторий на GitHub (например, `kataloga-super-admin`)

2. Добавьте remote и отправьте код:

```bash
cd apps/super-admin

# Добавить remote
git remote add origin https://github.com/YOUR_USERNAME/kataloga-super-admin.git

# Или через SSH
git remote add origin git@github.com:YOUR_USERNAME/kataloga-super-admin.git

# Отправить код
git branch -M main
git push -u origin main
```

### Вариант 2: GitLab

1. Создайте новый проект на GitLab

2. Добавьте remote:

```bash
cd apps/super-admin

git remote add origin https://gitlab.com/YOUR_USERNAME/kataloga-super-admin.git
# Или SSH
git remote add origin git@gitlab.com:YOUR_USERNAME/kataloga-super-admin.git

git branch -M main
git push -u origin main
```

### Вариант 3: Bitbucket

1. Создайте новый репозиторий на Bitbucket

2. Добавьте remote:

```bash
cd apps/super-admin

git remote add origin https://YOUR_USERNAME@bitbucket.org/YOUR_USERNAME/kataloga-super-admin.git

git branch -M main
git push -u origin main
```

## Проверка настройки

```bash
cd apps/super-admin

# Проверить remote
git remote -v

# Проверить статус
git status

# Проверить историю
git log --oneline
```

## Работа с репозиторием

### Создание новой ветки

```bash
git checkout -b feature/new-feature
```

### Коммит изменений

```bash
git add .
git commit -m "feat: add new feature"
```

### Отправка изменений

```bash
git push origin feature/new-feature
```

### Обновление из remote

```bash
git pull origin main
```

## Клонирование на другой машине

Когда вы настроите remote, другие разработчики смогут клонировать репозиторий:

```bash
# Клонировать в папку apps/super-admin
cd apps
git clone https://github.com/YOUR_USERNAME/kataloga-super-admin.git super-admin

# Установить зависимости
cd super-admin
pnpm install

# Запустить dev сервер
pnpm dev
```

## Структура проекта Kataloga

После разделения структура выглядит так:

```
Kataloga/                          # Основной репозиторий
├── apps/
│   ├── backend/                   # Backend (в основном репо)
│   ├── frontend/                  # Frontend (в основном репо)
│   └── super-admin/               # Отдельный Git репозиторий
│       └── .git/                  # Собственная история Git
├── packages/                      # Общие пакеты (в основном репо)
├── .gitignore                     # Исключает super-admin, .kiro, .idea
└── ...
```

## Что исключено из основного репозитория

В основном репозитории Kataloga теперь игнорируются:

- `apps/super-admin/` - весь код Super Admin
- `.kiro/` - спецификации и настройки Kiro
- `.idea/` - настройки IntelliJ IDEA / WebStorm
- `.vscode/` - настройки VS Code

## Синхронизация изменений

### Если нужно обновить super-admin на другой машине:

```bash
cd apps/super-admin
git pull origin main
pnpm install  # если были изменения в package.json
```

### Если нужно обновить основной проект:

```bash
cd /path/to/Kataloga
git pull origin main
pnpm install  # если были изменения в зависимостях
```

## Важные замечания

1. **Независимые истории**: Super Admin и основной проект имеют независимые Git истории
2. **Отдельные коммиты**: Изменения в super-admin не влияют на основной репозиторий
3. **Отдельные ветки**: Можно создавать ветки независимо в каждом репозитории
4. **Отдельные права доступа**: Можно настроить разные права доступа для каждого репозитория

## CI/CD

Если используете CI/CD, нужно настроить отдельные пайплайны:

### GitHub Actions (пример)

**Основной репозиторий** (`.github/workflows/main.yml`):
```yaml
name: Main Project CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      # Не включает super-admin
```

**Super Admin репозиторий** (`.github/workflows/super-admin.yml`):
```yaml
name: Super Admin CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
```

## Troubleshooting

### Проблема: "fatal: not a git repository"

```bash
cd apps/super-admin
git init
git add .
git commit -m "Initial commit"
```

### Проблема: "remote origin already exists"

```bash
git remote remove origin
git remote add origin YOUR_REPO_URL
```

### Проблема: Изменения не отслеживаются

Проверьте, что вы в правильной директории:
```bash
pwd  # должно показать .../apps/super-admin
git status
```

## Дополнительная информация

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [GitLab Documentation](https://docs.gitlab.com/)

## Контакты

Для вопросов по настройке Git обращайтесь к команде разработки.
