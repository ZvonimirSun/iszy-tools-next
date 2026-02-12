import type { PDFDocumentProxy } from 'pdfjs-dist'

const pdfCache = new Map<File, {
  data: PDFDocumentProxy
  ref: number
}>()

export function usePdfManager() {
  return {
    async loadPdf(file: File) {
      const cache = pdfCache.get(file)
      if (cache) {
        cache.ref += 1
        return cache.data
      }
      const { getDocument } = await usePdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      pdfCache.set(file, {
        data: pdf,
        ref: 1,
      })
      return pdf
    },
    releasePdf(file: File) {
      if (pdfCache.has(file)) {
        const cache = pdfCache.get(file)!
        cache.ref -= 1
        if (cache.ref <= 0) {
          pdfCache.delete(file)
          cache.data.destroy()
        }
      }
    },
  }
}
