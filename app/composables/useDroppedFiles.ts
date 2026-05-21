export function useDroppedFiles() {
  function getDroppedFiles(event: DragEvent, predicate?: (file: File) => boolean) {
    const files = Array.from(event.dataTransfer?.files ?? [])
    return predicate ? files.filter(predicate) : files
  }

  function isPdfFile(file: File) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  }

  function isImageFile(file: File) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  }

  return {
    getDroppedFiles,
    isPdfFile,
    isImageFile,
  }
}
