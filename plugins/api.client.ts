import { ApiService } from '~/services/api.service'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const apiService = new ApiService(config.public.apiUrl as string)

  return {
    provide: {
      api: apiService.getInstance(),
      apiService,
    },
  }
})
