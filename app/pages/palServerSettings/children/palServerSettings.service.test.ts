import { describe, expect, it } from 'vitest'
import { getEmptySettings, iniToSettings, settingsToIni } from './palServerSettings.service'

describe('palServerSettings.service', () => {
  it('generates PalWorldSettings.ini from defaults', () => {
    const ini = settingsToIni(getEmptySettings())

    expect(ini).toContain('[/Script/Pal.PalGameWorldSettings]')
    expect(ini).toContain('OptionSettings=(')
    expect(ini).toContain('Difficulty=None')
    expect(ini).toContain('DayTimeSpeedRate=1.000000')
    expect(ini).toContain('bEnableFastTravel=True')
    expect(ini).toContain('ServerName="Palworld Server"')
  })

  it('parses setting values from an ini file', () => {
    const source = '[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(Difficulty=Easy,DayTimeSpeedRate=2.500000,bEnableFastTravel=False,ServerName="测试服务器")\n\n'
    const settings = iniToSettings(source)

    expect(settings.find(item => item.key === 'Difficulty')?.default).toBe('Easy')
    expect(settings.find(item => item.key === 'DayTimeSpeedRate')?.default).toBe(2.5)
    expect(settings.find(item => item.key === 'bEnableFastTravel')?.default).toBe(false)
    expect(settings.find(item => item.key === 'ServerName')?.default).toBe('测试服务器')
  })
})
