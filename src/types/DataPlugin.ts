import { ChartPointCollection, ChartPoint } from '../types/Chart'

export type GetParams = {
  sprint: string
}

export type SetParams = GetParams & {
  newData: ChartPoint[]
}

interface DataPlugin {
  get: (args: GetParams) => Promise<ChartPointCollection>

  set: (args: SetParams) => Promise<void>
}

export default DataPlugin
