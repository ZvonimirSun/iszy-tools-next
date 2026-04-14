export function formatFloat(value: number, digits = 4): string {
  return Number(value.toFixed(digits)).toString()
}
