// Export utilities for analytics data

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(',')
  
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key]
      // Handle values with commas, quotes, or newlines
      if (value === null || value === undefined) {
        return ''
      }
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })

  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export chart as image
 */
export async function exportChartAsImage(
  chartElement: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    // Use html2canvas for chart export
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
    })
    
    const dataUrl = canvas.toDataURL(`image/${format}`)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.${format}`
    link.click()
  } catch (error) {
    console.error('Failed to export chart:', error)
    throw new Error('Failed to export chart as image')
  }
}

/**
 * Format data for export
 */
export function formatDataForExport(data: any, type: 'registration' | 'tenant' | 'revenue'): any[] {
  switch (type) {
    case 'registration':
      return formatRegistrationData(data)
    case 'tenant':
      return formatTenantData(data)
    case 'revenue':
      return formatRevenueData(data)
    default:
      return []
  }
}

function formatRegistrationData(metrics: any): any[] {
  if (!metrics || !metrics.trends) return []
  
  return metrics.trends.map((item: any) => ({
    Date: item.date,
    Count: item.count,
    Status: item.status,
  }))
}

function formatTenantData(metrics: any): any[] {
  if (!metrics || !metrics.growthTrend) return []
  
  return metrics.growthTrend.map((item: any) => ({
    Date: item.date,
    'Total Tenants': item.total,
    'Active Tenants': item.active,
    'Churned Tenants': item.churned,
  }))
}

function formatRevenueData(metrics: any): any[] {
  if (!metrics || !metrics.revenueTrend) return []
  
  return metrics.revenueTrend.map((item: any) => ({
    Date: item.date,
    Revenue: item.amount,
    MRR: item.mrr,
  }))
}
