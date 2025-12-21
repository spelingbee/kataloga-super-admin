import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import type { 
  MenuState, 
  MenuListItem, 
  MenuDetails,
  MenuItem,
  MenuItemFilters,
  CategoryWithItemCount,
  PaginatedResponse,
  MenuHistory
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useMenuStore = defineStore('menu', {
  state: (): MenuState & { menuHistory: MenuHistory | null } => ({
    menus: [],
    currentMenu: null,
    menuItems: [],
    categories: [],
    menuHistory: null,
    itemFilters: {
      search: '',
      categoryId: '',
      minPrice: undefined,
      maxPrice: undefined,
      isActive: undefined,
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  }),

  getters: {
    activeMenus: (state): MenuListItem[] => {
      if (!state.menus || !Array.isArray(state.menus)) return []
      return state.menus.filter(m => m?.isActive)
    },

    inactiveMenus: (state): MenuListItem[] => {
      if (!state.menus || !Array.isArray(state.menus)) return []
      return state.menus.filter(m => !m?.isActive)
    },

    totalMenuItems: (state): number => {
      if (!state.menus || !Array.isArray(state.menus)) return 0
      return state.menus.reduce((sum, menu) => sum + (menu?.itemCount || 0), 0)
    },

    totalActiveItems: (state): number => {
      if (!state.menus || !Array.isArray(state.menus)) return 0
      return state.menus.reduce((sum, menu) => sum + (menu?.activeItemCount || 0), 0)
    },

    hasFilters: (state): boolean => {
      if (!state.itemFilters) return false
      return !!(
        state.itemFilters.search ||
        state.itemFilters.categoryId ||
        state.itemFilters.minPrice !== undefined ||
        state.itemFilters.maxPrice !== undefined ||
        state.itemFilters.isActive !== undefined
      )
    },
  },

  actions: {
    async fetchMenus(tenantId: string, page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        const response = await apiService.get<PaginatedResponse<MenuListItem>>(
          `/api/admin/tenants/${tenantId}/menus`,
          { params }
        )

        this.menus = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch menus'
        console.error('Menu fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMenuDetails(tenantId: string, menuId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<MenuDetails>(
          `/api/admin/tenants/${tenantId}/menus/${menuId}`
        )

        this.currentMenu = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch menu details'
        console.error('Menu details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMenuItems(tenantId: string, menuId: string, page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.itemFilters.search) {
          params.search = this.itemFilters.search
        }
        if (this.itemFilters.categoryId) {
          params.categoryId = this.itemFilters.categoryId
        }
        if (this.itemFilters.minPrice !== undefined) {
          params.minPrice = this.itemFilters.minPrice
        }
        if (this.itemFilters.maxPrice !== undefined) {
          params.maxPrice = this.itemFilters.maxPrice
        }
        if (this.itemFilters.isActive !== undefined) {
          params.isActive = this.itemFilters.isActive
        }

        const response = await apiService.get<PaginatedResponse<MenuItem>>(
          `/api/admin/tenants/${tenantId}/menus/${menuId}/items`,
          { params }
        )

        this.menuItems = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch menu items'
        console.error('Menu items fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createMenuItem(
      tenantId: string, 
      menuId: string, 
      itemData: {
        name: string
        description?: string
        price: number
        imageUrl?: string
        categoryId: string
        isActive?: boolean
      }
    ): Promise<MenuItem> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<MenuItem>(
          `/api/admin/tenants/${tenantId}/menus/${menuId}/items`,
          itemData
        )

        // Add to local state
        this.menuItems.unshift(response.data)
        
        // Update menu item count
        const menu = this.menus.find(m => m.id === menuId)
        if (menu) {
          menu.itemCount++
          if (response.data.isActive) {
            menu.activeItemCount++
          }
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create menu item'
        throw error
      }
    },

    async updateMenuItem(
      tenantId: string,
      menuId: string,
      itemId: string,
      itemData: Partial<{
        name: string
        description: string
        price: number
        imageUrl: string
        categoryId: string
        isActive: boolean
      }>
    ): Promise<MenuItem> {
      try {
        const { apiService } = useApi()
        const response = await apiService.patch<MenuItem>(
          `/api/admin/tenants/${tenantId}/menus/${menuId}/items/${itemId}`,
          itemData
        )

        // Update local state
        const index = this.menuItems.findIndex(item => item.id === itemId)
        if (index !== -1) {
          this.menuItems[index] = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update menu item'
        throw error
      }
    },

    async deleteMenuItem(tenantId: string, menuId: string, itemId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.delete(
          `/api/admin/tenants/${tenantId}/menus/${menuId}/items/${itemId}`
        )

        // Remove from local state
        const item = this.menuItems.find(i => i.id === itemId)
        this.menuItems = this.menuItems.filter(i => i.id !== itemId)
        
        // Update menu item count
        const menu = this.menus.find(m => m.id === menuId)
        if (menu && item) {
          menu.itemCount--
          if (item.isActive) {
            menu.activeItemCount--
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete menu item'
        throw error
      }
    },

    async bulkUpdateMenuItems(
      tenantId: string,
      menuId: string,
      itemIds: string[],
      updates: {
        isActive?: boolean
        price?: number
        categoryId?: string
      }
    ): Promise<{ affectedCount: number; message: string }> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<{ affectedCount: number; message: string }>(
          `/api/admin/tenants/${tenantId}/menus/${menuId}/items/bulk-update`,
          {
            itemIds,
            ...updates
          }
        )

        // Refresh menu items to reflect changes
        await this.fetchMenuItems(tenantId, menuId, this.pagination.page)

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk update menu items'
        throw error
      }
    },

    async fetchCategories(tenantId: string, page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        const params: Record<string, any> = {
          page,
          limit: 100, // Get all categories
        }

        const response = await apiService.get<PaginatedResponse<CategoryWithItemCount>>(
          `/api/admin/tenants/${tenantId}/menus/categories`,
          { params }
        )

        this.categories = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch categories'
        console.error('Categories fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCategory(
      tenantId: string,
      categoryData: { name: string }
    ): Promise<CategoryWithItemCount> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<CategoryWithItemCount>(
          `/api/admin/tenants/${tenantId}/menus/categories`,
          categoryData
        )

        // Add to local state
        this.categories.push(response.data)

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create category'
        throw error
      }
    },

    async updateCategory(
      tenantId: string,
      categoryId: string,
      categoryData: { name: string }
    ): Promise<CategoryWithItemCount> {
      try {
        const { apiService } = useApi()
        const response = await apiService.patch<CategoryWithItemCount>(
          `/api/admin/tenants/${tenantId}/menus/categories/${categoryId}`,
          categoryData
        )

        // Update local state
        const index = this.categories.findIndex(cat => cat.id === categoryId)
        if (index !== -1) {
          this.categories[index] = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update category'
        throw error
      }
    },

    async deleteCategory(tenantId: string, categoryId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.delete(
          `/api/admin/tenants/${tenantId}/menus/categories/${categoryId}`
        )

        // Remove from local state
        this.categories = this.categories.filter(cat => cat.id !== categoryId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete category'
        throw error
      }
    },

    setItemFilters(filters: Partial<MenuItemFilters>): void {
      this.itemFilters = { ...this.itemFilters, ...filters }
      this.pagination.page = 1
    },

    clearItemFilters(): void {
      this.itemFilters = {
        search: '',
        categoryId: '',
        minPrice: undefined,
        maxPrice: undefined,
        isActive: undefined,
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentMenu(): void {
      this.currentMenu = null
      this.menuItems = []
      this.menuHistory = null
    },

    async fetchMenuHistory(
      tenantId: string,
      filters?: {
        menuId?: string
        menuItemId?: string
        categoryId?: string
        action?: string
        startDate?: string
        endDate?: string
      }
    ): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const params: Record<string, any> = {}

        if (filters?.menuId) params.menuId = filters.menuId
        if (filters?.menuItemId) params.menuItemId = filters.menuItemId
        if (filters?.categoryId) params.categoryId = filters.categoryId
        if (filters?.action) params.action = filters.action
        if (filters?.startDate) params.startDate = filters.startDate
        if (filters?.endDate) params.endDate = filters.endDate

        const response = await apiService.get<MenuHistory>(
          `/api/admin/audit/menu/${tenantId}/history`,
          { params }
        )

        this.menuHistory = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch menu history'
        console.error('Menu history fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    resetState(): void {
      this.menus = []
      this.currentMenu = null
      this.menuItems = []
      this.categories = []
      this.menuHistory = null
      this.itemFilters = {
        search: '',
        categoryId: '',
        minPrice: undefined,
        maxPrice: undefined,
        isActive: undefined,
      }
      this.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      }
      this.loading = false
      this.error = null
    },
  },
})
