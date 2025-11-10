// Composable for export functionality

import { ref } from 'vue'
import { downloadCSV, exportChartAsImage, formatDataForExport } from '~/utils/export'
import { generateAnalyticsPDFReport } from '~/utils/pdf-export'
import type { DateRange } from '~/types'

export function useExport() {
  const exporting = ref(false)
  const exportError = ref<string | null>(null)

  /**
   * Export data as CSV
   */
  const exportToCSV = async (
    data: any[],
    filename: string,
    headers?: string[]
  ): Promise<void> => {
    try {
      exporting.value = true
      exportError.value = null
      
      downloadCSV(data, filename, headers)
      
      const { success } = useNotification()
      success('Data exported successfully')
    } catch (error: any) {
      exportError.value = error.message || 'Failed to export CSV'
      const { error: notifyError } = useNotification()
      notifyError(exportError.value || 'Failed to export CSV')
      throw error
    } finally {
      exporting.value = false
    }
  }

  /**
   * Export chart as image
   */
  const exportChart = async (
    chartElement: HTMLElement,
    filename: string,
    format: 'png' | 'jpeg' = 'png'
  ): Promise<void> => {
    try {
      exporting.value = true
      exportError.value = null
      
      await exportChartAsImage(chartElement, filename, format)
      
      const { success } = useNotification()
      success('Chart exported successfully')
    } catch (error: any) {
      exportError.value = error.message || 'Failed to export chart'
      const { error: notifyError } = useNotification()
      notifyError(exportError.value || 'Failed to export chart')
      throw error
    } finally {
      exporting.value = false
    }
  }

  /**
   * Export analytics as PDF
   */
  const exportAnalyticsPDF = async (
    dateRange: DateRange,
    analyticsData: {
      registration?: any
      tenant?: any
      revenue?: any
    }
  ): Promise<void> => {
    try {
      exporting.value = true
      exportError.value = null
      
      await generateAnalyticsPDFReport(dateRange, analyticsData)
      
      const { success } = useNotification()
      success('PDF report generated successfully')
    } catch (error: any) {
      exportError.value = error.message || 'Failed to generate PDF'
      const { error: notifyError } = useNotification()
      notifyError(exportError.value || 'Failed to generate PDF')
      throw error
    } finally {
      exporting.value = false
    }
  }

  /**
   * Export formatted analytics data
   */
  const exportAnalyticsData = async (
    data: any,
    type: 'registration' | 'tenant' | 'revenue',
    filename: string
  ): Promise<void> => {
    const formattedData = formatDataForExport(data, type)
    await exportToCSV(formattedData, filename)
  }

  /**
   * Send report via email (calls backend API)
   */
  const emailReport = async (
    reportType: string,
    dateRange: DateRange,
    recipientEmail: string
  ): Promise<void> => {
    try {
      exporting.value = true
      exportError.value = null
      
      const { apiService } = useApi()
      await apiService.post('/api/admin/analytics/email-report', {
        reportType,
        dateRange,
        recipientEmail,
      })
      
      const { success } = useNotification()
      success(`Report will be sent to ${recipientEmail}`)
    } catch (error: any) {
      exportError.value = error.response?.data?.message || 'Failed to send report'
      const { error: notifyError } = useNotification()
      notifyError(exportError.value || 'Failed to send report')
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportError,
    exportToCSV,
    exportChart,
    exportAnalyticsPDF,
    exportAnalyticsData,
    emailReport,
  }
}
