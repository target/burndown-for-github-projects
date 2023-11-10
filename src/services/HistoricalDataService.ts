import { ChartPoint, ChartPointCollection } from '../types/Chart'
import { mapSprintToChartPoints } from './ChartService'
import env from './EnvService'
import { getSprintSummary } from './SprintPointService'

import { getDataPlugin } from '../utils/getDataPlugin'

export const fetchSprintData = async (): Promise<void> => {
  console.log(
    `[${new Date().toLocaleString()}] Fetching sprint data for storage`,
  )

  const dataPlugin = getDataPlugin()

  const currentSprint = await getSprintSummary(
    env.GITHUB_DEFAULT_ORGANIZATION_NAME,
  )

  const newChartPoints = mapSprintToChartPoints(currentSprint)
  await dataPlugin.set({
    sprint: `${env.GITHUB_DEFAULT_ORGANIZATION_NAME}-${currentSprint.id}`,
    newData: newChartPoints,
  })
}

export async function getHistoricalSprintData(
  sprintId: string,
): Promise<ChartPoint[]> {
  const dataPlugin = getDataPlugin()

  const chartData: ChartPointCollection = await dataPlugin.get({
    sprint: sprintId,
  })
  return Object.values(chartData)
    .map((chartPoint) => ({
      ...chartPoint,
      x: new Date(chartPoint.x),
    }))
    .sort(({ x: a }, { x: b }) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
}
