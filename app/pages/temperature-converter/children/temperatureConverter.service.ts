export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin' | 'rankine' | 'delisle' | 'newton' | 'reaumur' | 'romer'

export interface TemperatureRow {
  unit: TemperatureUnit
  label: string
  value: number
}

export const temperatureUnits: Array<{ unit: TemperatureUnit, label: string }> = [
  { unit: 'celsius', label: '摄氏度 °C' },
  { unit: 'fahrenheit', label: '华氏度 °F' },
  { unit: 'kelvin', label: '开尔文 K' },
  { unit: 'rankine', label: '兰氏度 °R' },
  { unit: 'delisle', label: '德利尔 °De' },
  { unit: 'newton', label: '牛顿 °N' },
  { unit: 'reaumur', label: '列氏 °Ré' },
  { unit: 'romer', label: '罗默 °Rø' },
]

export function convertTemperature(value: number, from: TemperatureUnit): TemperatureRow[] {
  const celsius = toCelsius(value, from)
  return temperatureUnits.map(({ unit, label }) => ({
    unit,
    label,
    value: fromCelsius(celsius, unit),
  }))
}

function toCelsius(value: number, unit: TemperatureUnit) {
  switch (unit) {
    case 'celsius':
      return value
    case 'fahrenheit':
      return (value - 32) * 5 / 9
    case 'kelvin':
      return value - 273.15
    case 'rankine':
      return (value - 491.67) * 5 / 9
    case 'delisle':
      return 100 - value * 2 / 3
    case 'newton':
      return value * 100 / 33
    case 'reaumur':
      return value * 5 / 4
    case 'romer':
      return (value - 7.5) * 40 / 21
  }
}

function fromCelsius(value: number, unit: TemperatureUnit) {
  switch (unit) {
    case 'celsius':
      return value
    case 'fahrenheit':
      return value * 9 / 5 + 32
    case 'kelvin':
      return value + 273.15
    case 'rankine':
      return (value + 273.15) * 9 / 5
    case 'delisle':
      return (100 - value) * 3 / 2
    case 'newton':
      return value * 33 / 100
    case 'reaumur':
      return value * 4 / 5
    case 'romer':
      return value * 21 / 40 + 7.5
  }
}
