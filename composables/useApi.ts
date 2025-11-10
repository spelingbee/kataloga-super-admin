import type { AxiosInstance } from 'axios'
import type { ApiService } from '~/services/api.service'

export const useApi = () => {
  const { $api, $apiService } = useNuxtApp()
  return {
    api: $api as AxiosInstance,
    apiService: $apiService as ApiService,
  }
}
