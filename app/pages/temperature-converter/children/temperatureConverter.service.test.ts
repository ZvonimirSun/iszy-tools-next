import { describe, expect, it } from 'vitest'
import { convertTemperature } from './temperatureConverter.service'

describe('temperatureConverter.service', () => {
  it('摄氏度转换为常见温标', () => {
    const rows = convertTemperature(0, 'celsius')
    const fahrenheit = rows.find(row => row.unit === 'fahrenheit')!
    const kelvin = rows.find(row => row.unit === 'kelvin')!

    expect(fahrenheit.value).toBe(32)
    expect(kelvin.value).toBe(273.15)
  })

  it('华氏度转换回摄氏度', () => {
    const celsius = convertTemperature(212, 'fahrenheit').find(row => row.unit === 'celsius')!

    expect(celsius.value).toBe(100)
  })

  it('开尔文转换为兰氏度', () => {
    const rankine = convertTemperature(273.15, 'kelvin').find(row => row.unit === 'rankine')!

    expect(rankine.value).toBe(491.66999999999996)
  })
})
