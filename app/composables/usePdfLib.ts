export async function usePdfJs() {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  if (!GlobalWorkerOptions.workerSrc) {
    const { cdnOrigin } = usePublicConfig()
    GlobalWorkerOptions.workerSrc = `${cdnOrigin}/jsd/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`
  }
  return {
    getDocument,
  }
}

export async function usePdfLib() {
  return import('pdf-lib')
}
