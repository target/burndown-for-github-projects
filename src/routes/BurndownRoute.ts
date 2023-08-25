import { Router } from 'express'
import env from '../services/EnvService'
import { createChart, mapSprintToChartPoints } from '../services/ChartService'
import { getSprintSummary } from '../services/SprintPointService'
import { ChartDimensions, ChartPoint } from '../types/Chart'
import PublicError from '../models/PublicError'
import { getHistoricalSprintData } from '../services/HistoricalDataService'

const BurndownRoute = Router()

BurndownRoute.get('/', async (req, res) => {
  const organization = env.GITHUB_DEFAULT_ORGANIZATION_NAME

  const chartDimensions =
    (req.query.size as ChartDimensions) || env.CHART_DEFAULT_DIMENSIONS

  try {
    const sprintSummary = await getSprintSummary(organization)
    const newChartData = mapSprintToChartPoints(sprintSummary)
    const historicalChartData = await getHistoricalSprintData(
      `${organization}-${sprintSummary.id}`
    )
    let endOfSprintData: ChartPoint[] = []

    if (new Date() < sprintSummary.endDate) {
      endOfSprintData = Object.keys(sprintSummary.columns).map(
        (sprintColumnName, index, allSprintColumns) => {
          const isLastSprintColumn = index === allSprintColumns.length - 1
          return {
            x: sprintSummary.endDate,
            y: isLastSprintColumn ? sprintSummary.storyPoints : 0,
            c: sprintColumnName,
          }
        }
      )
    }

    const chartData = [
      ...historicalChartData,
      ...newChartData,
      ...endOfSprintData,
    ]

    const burndownChart = await createChart(chartData, chartDimensions)

    return res.contentType('svg').send(burndownChart)
  } catch (err) {
    if (!(err instanceof PublicError)) {
      err = new PublicError(err)
    }
    return err.handle(res)
  }
})

export default BurndownRoute
