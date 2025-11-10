// PDF export utilities using jsPDF

import type { DateRange } from '~/types'

export interface PDFReportOptions {
  title: string
  dateRange: DateRange
  sections: PDFSection[]
  includeCharts?: boolean
}

export interface PDFSection {
  title: string
  data: any
  type: 'table' | 'metrics' | 'chart'
  chartElement?: HTMLElement
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<void> {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    let yPosition = 20

    // Add title
    doc.setFontSize(20)
    doc.text(options.title, 20, yPosition)
    yPosition += 10

    // Add date range
    doc.setFontSize(12)
    doc.text(`Period: ${options.dateRange.from} to ${options.dateRange.to}`, 20, yPosition)
    yPosition += 15

    // Add sections
    for (const section of options.sections) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Section title
      doc.setFontSize(14)
      doc.text(section.title, 20, yPosition)
      yPosition += 10

      if (section.type === 'table' && Array.isArray(section.data)) {
        // Add table
        const tableData = section.data.map(row => Object.values(row))
        const headers = section.data.length > 0 ? Object.keys(section.data[0]) : []
        
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: yPosition,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [14, 165, 233] },
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 15
      } else if (section.type === 'metrics') {
        // Add metrics
        doc.setFontSize(10)
        Object.entries(section.data).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 20, yPosition)
          yPosition += 7
        })
        yPosition += 8
      } else if (section.type === 'chart' && section.chartElement && options.includeCharts) {
        // Add chart image
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(section.chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 170
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        // Check if image fits on current page
        if (yPosition + imgHeight > 280) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 15
      }
    }

    // Add footer with generation date
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        20,
        290
      )
    }

    // Download PDF
    const filename = `${options.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw new Error('Failed to generate PDF report')
  }
}

/**
 * Generate analytics PDF report
 */
export async function generateAnalyticsPDFReport(
  dateRange: DateRange,
  analyticsData: {
    registration?: any
    tenant?: any
    revenue?: any
  }
): Promise<void> {
  const sections: PDFSection[] = []

  // Registration metrics
  if (analyticsData.registration) {
    sections.push({
      title: 'Registration Metrics',
      type: 'metrics',
      data: {
        'Total Registrations': analyticsData.registration.total,
        'Approved': analyticsData.registration.approved,
        'Rejected': analyticsData.registration.rejected,
        'Pending': analyticsData.registration.pending,
        'Conversion Rate': `${analyticsData.registration.conversionRate}%`,
      },
    })

    if (analyticsData.registration.trends?.length > 0) {
      sections.push({
        title: 'Registration Trends',
        type: 'table',
        data: analyticsData.registration.trends.map((t: any) => ({
          Date: t.date,
          Count: t.count,
          Status: t.status,
        })),
      })
    }
  }

  // Tenant metrics
  if (analyticsData.tenant) {
    sections.push({
      title: 'Tenant Performance',
      type: 'metrics',
      data: {
        'Total Tenants': analyticsData.tenant.totalTenants,
        'Active Tenants': analyticsData.tenant.activeTenants,
        'Retention Rate': `${analyticsData.tenant.retentionRate}%`,
        'Churn Rate': `${analyticsData.tenant.churnRate}%`,
      },
    })

    if (analyticsData.tenant.topPerformers?.length > 0) {
      sections.push({
        title: 'Top Performing Tenants',
        type: 'table',
        data: analyticsData.tenant.topPerformers.map((t: any) => ({
          Name: t.name,
          Revenue: `$${t.revenue.toFixed(2)}`,
          Orders: t.orderCount,
          'Growth Rate': `${t.growthRate}%`,
        })),
      })
    }
  }

  // Revenue metrics
  if (analyticsData.revenue) {
    sections.push({
      title: 'Revenue Metrics',
      type: 'metrics',
      data: {
        'MRR': `$${analyticsData.revenue.mrr.toFixed(2)}`,
        'ARR': `$${analyticsData.revenue.arr.toFixed(2)}`,
        'Total Revenue': `$${analyticsData.revenue.totalRevenue.toFixed(2)}`,
        'Revenue Growth': `${analyticsData.revenue.revenueGrowth}%`,
      },
    })

    if (analyticsData.revenue.revenueByPlan?.length > 0) {
      sections.push({
        title: 'Revenue by Plan',
        type: 'table',
        data: analyticsData.revenue.revenueByPlan.map((p: any) => ({
          Plan: p.plan,
          Revenue: `$${p.revenue.toFixed(2)}`,
          Percentage: `${p.percentage}%`,
          Subscribers: p.subscriberCount,
        })),
      })
    }
  }

  await generatePDFReport({
    title: 'Analytics Report',
    dateRange,
    sections,
    includeCharts: false,
  })
}
