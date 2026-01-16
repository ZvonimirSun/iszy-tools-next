const INCH = 0.0254
const DEGREE = 111194.872221777
const DEGREE_ARCGIS = 111194.92664455874

export function getScaleDomination(resolution: number, ppi: number, unit: 'degree' | 'meter' = 'meter', isArcGIS: boolean = false) {
  const tmp = resolution / INCH * ppi
  if (unit === 'degree') {
    return tmp * (isArcGIS ? DEGREE_ARCGIS : DEGREE)
  }
  else {
    return tmp
  }
}

export function getResolution(scaleDomination: number, ppi: number, unit: 'degree' | 'meter', isArcGIS: boolean = false) {
  const tmp = scaleDomination / ppi * INCH
  if (unit === 'degree') {
    return tmp / (isArcGIS ? DEGREE_ARCGIS : DEGREE)
  }
  else {
    return tmp
  }
}

export function getPPI(scaleDomination: number, resolution: number, unit: 'degree' | 'meter', isArcGIS: boolean = false) {
  const tmp = scaleDomination / resolution * INCH
  if (unit === 'degree') {
    return tmp / (isArcGIS ? DEGREE_ARCGIS : DEGREE)
  }
  else {
    return tmp
  }
}

export function pxToPPI(px: number) {
  return INCH / px
}

export function ppiToPX(ppi: number) {
  return INCH / ppi
}
