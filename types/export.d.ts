// Type definitions for export libraries

declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any)
    text(text: string, x: number, y: number): void
    setFontSize(size: number): void
    addPage(): void
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void
    save(filename: string): void
    getNumberOfPages(): number
    setPage(page: number): void
  }
}

declare module 'jspdf-autotable' {
  export default function autoTable(doc: any, options: any): void
}

declare module 'html2canvas' {
  export default function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>
}
