import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

if (!GlobalWorkerOptions.workerSrc) {
  const { cdnOrigin } = usePublicConfig()
  GlobalWorkerOptions.workerSrc = `${cdnOrigin}/jsd/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`
}

export {
  getDocument,
}
