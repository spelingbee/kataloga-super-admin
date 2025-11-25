# Миграция UI компонентов на SCSS + БЭМ

## Что изменилось

### Архитектура стилей

**Было:** Tailwind CSS классы в каждом компоненте
**Стало:** SCSS с БЭМ методологией + централизованные стили

### Правила стилизации

1. **БЭМ без nested селекторов** - все классы пишутся отдельно для лучшей читабельности
2. **Вынос больших стилей** - если стили >50-70 строк, выносим в отдельный файл
3. **Обязательное использование переменных** - никаких хардкод значений
4. **Максимум 1 уровень вложенности** - кроме псевдоклассов и медиа-запросов
5. **DART SASS синтаксис** - `@use` вместо `@import`

### Структура

```
apps/super-admin/
├── assets/scss/
│   ├── main.scss                    # Главный файл (только глобальные стили)
│   ├── variables.scss               # Переменные (цвета, отступы и т.д.)
│   └── _utilities.scss              # Глобальные утилитарные классы
├── components/ui/
│   ├── DataTable.vue                # Таблица с сортировкой и пагинацией
│   ├── _data-table.scss             # Стили DataTable (>200 строк)
│   ├── FormInput.vue                # Текстовое поле
│   ├── FormSelect.vue               # Выпадающий список
│   ├── FormTextarea.vue             # Многострочное поле
│   ├── FormCheckbox.vue             # Чекбокс
│   ├── FormRadio.vue                # Радио кнопки
│   ├── FormDatePicker.vue           # Выбор даты
│   ├── _forms.scss                  # Общие стили форм (>200 строк)
│   ├── Toast.vue                    # Уведомление
│   ├── ToastContainer.vue           # Контейнер уведомлений
│   ├── _toast.scss                  # Стили Toast (>200 строк)
│   ├── Modal.vue                    # Модальное окно
│   ├── ConfirmDialog.vue            # Диалог подтверждения
│   ├── FormDialog.vue               # Диалог с формой
│   ├── _modal.scss                  # Стили Modal (>200 строк)
│   └── README.md                    # Документация
├── composables/
│   ├── useModal.ts                  # Управление модальными окнами
│   ├── useNotification.ts           # Управление уведомлениями
│   └── useConfirm.ts                # Управление диалогами подтверждения
└── stores/
    └── notification.ts              # Store для уведомлений
```

**Важно:** Стили компонентов хранятся РЯДОМ с компонентами, а не централизованно!

### Использование DART SASS

Все импорты используют новый синтаксис `@use` вместо устаревшего `@import`:

```scss
// main.scss
@use './variables' as *;
@use './components/ui';
```

### БЭМ методология

Все классы следуют БЭМ:
- **Block**: `.data-table`, `.form-input`, `.modal`
- **Element**: `.data-table__header`, `.form-input__label`, `.modal__body`
- **Modifier**: `.data-table__header--sortable`, `.form-input__field--error`

### Локализация стилей компонентов

Стили компонентов хранятся РЯДОМ с самими компонентами для лучшей организации и производительности билда.

**Если стили >200 строк:**
```
components/ui/
├── DataTable.vue
└── _data-table.scss    # Стили рядом с компонентом
```

Компонент импортирует свои стили:
```vue
<style scoped lang="scss">
@use './data-table';
</style>
```

**Если стили <200 строк:**
Стили остаются внутри компонента:
```vue
<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.metric-card {
  padding: $spacing-lg;
}
</style>
```

**Централизованно только глобальные утилиты:**
- `assets/scss/_utilities.scss` - классы типа `.container`, `.btn`
- НЕ стили конкретных компонентов!

## Преимущества

1. **Единый источник стилей** - легко поддерживать и изменять
2. **БЭМ** - понятная структура, нет конфликтов имен
3. **SCSS переменные** - легко кастомизировать цвета, отступы и т.д.
4. **Современный DART SASS** - использование `@use` вместо `@import`
5. **Меньше дублирования** - стили определены один раз
6. **Лучшая производительность** - меньше CSS в итоговом бандле

## Переменные

Все переменные определены в `assets/scss/variables.scss`:

```scss
// Цвета
$primary-color: #0ea5e9;
$success-color: #10b981;
$error-color: #ef4444;
$warning-color: #f59e0b;

// Отступы
$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;

// Радиусы
$radius-sm: 0.25rem;
$radius-md: 0.5rem;
$radius-lg: 0.75rem;

// Тени
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

// Переходы
$transition-fast: 150ms ease-in-out;
$transition-base: 200ms ease-in-out;
```

## Как использовать

### Пример: DataTable

```vue
<template>
  <DataTable
    :columns="columns"
    :data="tenants"
    :searchable="true"
    :paginated="true"
    @sort-change="handleSort"
  >
    <template #cell-status="{ value }">
      <span :class="getStatusClass(value)">{{ value }}</span>
    </template>
    
    <template #actions="{ row }">
      <button @click="edit(row)">Edit</button>
      <button @click="remove(row)">Delete</button>
    </template>
  </DataTable>
</template>

<script setup>
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'createdAt', label: 'Created', sortable: true, formatter: formatDate }
]
</script>
```

### Пример: Уведомления

```vue
<script setup>
import { useNotification } from '~/composables/useNotification'

const notification = useNotification()

async function saveTenant() {
  try {
    await api.saveTenant(data)
    notification.success('Tenant saved successfully!')
  } catch (error) {
    notification.error('Failed to save tenant', 'Error')
  }
}
</script>
```

### Пример: Модальное окно

```vue
<script setup>
import { useModal } from '~/composables/useModal'

const { isOpen, open, close } = useModal()
</script>

<template>
  <button @click="open">Create Tenant</button>
  
  <FormDialog
    v-model="isOpen"
    title="Create New Tenant"
    @submit="handleSubmit"
    @cancel="close"
  >
    <FormInput v-model="form.name" label="Name" required />
    <FormInput v-model="form.email" label="Email" type="email" required />
    <FormSelect v-model="form.plan" label="Plan" :options="plans" required />
  </FormDialog>
</template>
```

## Миграция существующих компонентов

Если нужно мигрировать существующий компонент:

1. Замените Tailwind классы на БЭМ классы
2. Добавьте стили в `assets/scss/components/_ui.scss`
3. В компоненте оставьте только `<style scoped lang="scss">`
4. Используйте переменные из `variables.scss`

## Документация

Полная документация по компонентам: `components/ui/README.md`
