# UI Components Library

Библиотека переиспользуемых UI компонентов для Super Admin панели.

## Стилизация

Все компоненты используют:
- **БЭМ методологию** для именования классов
- **SCSS** с новым синтаксисом DART (`@use` вместо `@import`)
- **Scoped стили** для изоляции
- Общие стили вынесены в `assets/scss/components/_ui.scss`

## Компоненты

### DataTable

Таблица данных с сортировкой, поиском и пагинацией.

```vue
<DataTable
  :columns="columns"
  :data="data"
  :searchable="true"
  :paginated="true"
  :per-page="10"
  @page-change="handlePageChange"
  @sort-change="handleSortChange"
>
  <template #cell-status="{ value }">
    <span :class="statusClass(value)">{{ value }}</span>
  </template>
  
  <template #actions="{ row }">
    <button @click="edit(row)">Edit</button>
    <button @click="delete(row)">Delete</button>
  </template>
</DataTable>
```

**Props:**
- `columns` - массив колонок `{ key, label, sortable?, formatter? }`
- `data` - массив данных
- `searchable` - включить поиск (default: true)
- `paginated` - включить пагинацию (default: true)
- `perPage` - элементов на странице (default: 10)
- `rowKey` - ключ для идентификации строк (default: 'id')

### Form Components

#### FormInput

```vue
<FormInput
  v-model="email"
  label="Email"
  type="email"
  placeholder="Enter email"
  :required="true"
  :error="errors.email"
  hint="We'll never share your email"
/>
```

#### FormSelect

```vue
<FormSelect
  v-model="role"
  label="Role"
  :options="roles"
  option-label="name"
  option-value="id"
  :required="true"
/>
```

#### FormTextarea

```vue
<FormTextarea
  v-model="description"
  label="Description"
  :rows="5"
  placeholder="Enter description"
/>
```

#### FormCheckbox

```vue
<FormCheckbox
  v-model="agreed"
  label="I agree to terms"
  :required="true"
/>
```

#### FormRadio

```vue
<FormRadio
  v-model="plan"
  group-label="Select Plan"
  :options="plans"
  option-label="name"
  option-value="id"
/>
```

#### FormDatePicker

```vue
<FormDatePicker
  v-model="startDate"
  label="Start Date"
  :min="today"
  :required="true"
/>
```

### Notification System

#### Использование через composable

```vue
<script setup>
import { useNotification } from '~/composables/useNotification'

const notification = useNotification()

function save() {
  try {
    // ... save logic
    notification.success('Saved successfully!')
  } catch (error) {
    notification.error('Failed to save', 'Error')
  }
}

// С действием
notification.info('New update available', 'Update', 0, {
  label: 'Update Now',
  handler: () => updateApp()
})
</script>
```

**Методы:**
- `success(message, title?, duration?)`
- `error(message, title?, duration?)`
- `warning(message, title?, duration?)`
- `info(message, title?, duration?)`
- `notify(type, message, title?, duration?, action?)`

### Modal

```vue
<script setup>
import { useModal } from '~/composables/useModal'

const { isOpen, open, close } = useModal()
</script>

<template>
  <button @click="open">Open Modal</button>
  
  <Modal
    v-model="isOpen"
    title="Edit User"
    size="md"
    :closable="true"
  >
    <p>Modal content here</p>
    
    <template #footer>
      <button @click="close">Cancel</button>
      <button @click="save">Save</button>
    </template>
  </Modal>
</template>
```

**Props:**
- `modelValue` - открыт/закрыт
- `title` - заголовок
- `size` - размер: 'sm' | 'md' | 'lg' | 'xl'
- `closable` - показать кнопку закрытия
- `closeOnOverlay` - закрывать при клике на overlay

### ConfirmDialog

```vue
<script setup>
const showConfirm = ref(false)

async function deleteItem() {
  showConfirm.value = true
}

function handleConfirm() {
  // Удаление
  showConfirm.value = false
}
</script>

<template>
  <ConfirmDialog
    v-model="showConfirm"
    title="Delete Item"
    message="Are you sure you want to delete this item?"
    type="danger"
    confirm-text="Delete"
    @confirm="handleConfirm"
  />
</template>
```

**Props:**
- `type` - 'danger' | 'warning' | 'info' | 'default'
- `icon` - показать иконку (default: true)

### FormDialog

```vue
<script setup>
const { isOpen, open, close } = useModal()
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    // ... submit logic
    close()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FormDialog
    v-model="isOpen"
    title="Create User"
    :loading="loading"
    @submit="handleSubmit"
    @cancel="close"
  >
    <FormInput v-model="name" label="Name" />
    <FormInput v-model="email" label="Email" type="email" />
  </FormDialog>
</template>
```

## Composables

### useModal

```ts
const { isOpen, open, close, toggle } = useModal(false)
```

### useNotification

```ts
const { success, error, warning, info, notify, remove, clear } = useNotification()
```

### useConfirm

```ts
const { state, confirm, handleConfirm, handleCancel } = useConfirm()

// Использование
const confirmed = await confirm({
  title: 'Delete Item',
  message: 'Are you sure?',
  type: 'danger'
})

if (confirmed) {
  // Удаление
}
```

## Стилизация

Все переменные определены в `assets/scss/variables.scss`:

```scss
$primary-color: #0ea5e9;
$success-color: #10b981;
$error-color: #ef4444;
$warning-color: #f59e0b;
// и т.д.
```

Для кастомизации компонентов можно переопределить переменные или добавить свои стили в `assets/scss/components/_ui.scss`.
