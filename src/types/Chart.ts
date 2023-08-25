export type ChartDimensions = `${number}x${number}`
export type ChartPoint = {
  x: Date
  y: number
  c: string
}
export interface ChartPointCollection {
  [chartPointId: string]: ChartPoint
}
