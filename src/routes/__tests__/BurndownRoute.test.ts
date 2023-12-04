import BurndownRoute from '../BurndownRoute'
import { request } from './utils'
import PublicError from '../../models/PublicError'

import { StatusCodes } from 'http-status-codes'

import * as env from '../../services/EnvService'
jest.mock('../../services/EnvService', () => ({}))

import { getSprintSummary as baseGetSprintSummary } from '../../services/SprintPointService'
jest.mock('../../services/SprintPointService', () => ({
  getSprintSummary: jest.fn(),
}))
const getSprintSummary = baseGetSprintSummary as jest.Mock

import {
  createChart as baseCreateChart,
  mapSprintToChartPoints as baseMapSprintToChartPoints,
} from '../../services/ChartService'
jest.mock('../../services/ChartService', () => ({
  createChart: jest.fn(),
  mapSprintToChartPoints: jest.fn(
    jest.requireActual('../../services/ChartService').mapSprintToChartPoints,
  ),
}))
const createChart = baseCreateChart as jest.Mock
const mapSprintToChartPoints = baseMapSprintToChartPoints as jest.Mock

import { getHistoricalSprintData as baseGetHistoricalSprintData } from '../../services/HistoricalDataService'
jest.mock('../../services/HistoricalDataService', () => ({
  getHistoricalSprintData: jest.fn(),
}))
const getHistoricalSprintData = baseGetHistoricalSprintData as jest.Mock

describe('BurndownRoute', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2021, 3, 1))
  })

  it('does not pass a sprint ID (they are inferred)', async () => {
    getSprintSummary.mockResolvedValueOnce({ columns: {} })
    getHistoricalSprintData.mockResolvedValueOnce([])
    await request(BurndownRoute).get('/').send()

    expect(getSprintSummary).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(), // <-- The sprint ID would be here
    )
  })

  it('applies the default organization name', async () => {
    env.default.GITHUB_DEFAULT_ORGANIZATION_NAME = 'The-Even-Cooler-Kids'
    getSprintSummary.mockResolvedValueOnce({ columns: {} })
    getHistoricalSprintData.mockResolvedValueOnce([])
    await request(BurndownRoute).get('/').send()

    expect(getSprintSummary).toHaveBeenCalledWith('The-Even-Cooler-Kids')
    expect(getHistoricalSprintData).toHaveBeenCalledWith(
      expect.stringMatching(/^The-Even-Cooler-Kids-/),
    )
  })

  it('accepts a size query parameter', async () => {
    env.default.CHART_DEFAULT_DIMENSIONS = '1000x1000'
    getSprintSummary.mockResolvedValueOnce({
      id: 123,
      columns: {},
    })
    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/?size=50x50').send()

    expect(createChart).toHaveBeenCalledWith(expect.anything(), '50x50')
  })

  it('applies the default chart size', async () => {
    env.default.CHART_DEFAULT_DIMENSIONS = '1000x1000'
    getSprintSummary.mockResolvedValueOnce({
      id: 123,
      columns: {},
    })
    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/').send()

    expect(createChart).toHaveBeenCalledWith(expect.anything(), '1000x1000')
  })

  it('fetches historical data for the resolved sprint', async () => {
    env.default.GITHUB_DEFAULT_ORGANIZATION_NAME = '1000x1000'
    getSprintSummary.mockResolvedValueOnce({
      id: 763,
      columns: {},
    })

    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/').send()

    expect(getHistoricalSprintData).toHaveBeenCalledWith(
      expect.stringMatching(/-763$/),
    )
  })

  it('feeds sprint summary data through the chart point converter', async () => {
    const sprintSummary = {
      foo: 'bar',
      columns: {},
    }
    getSprintSummary.mockResolvedValueOnce(sprintSummary)
    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/').send()

    expect(mapSprintToChartPoints).toHaveBeenCalledWith(sprintSummary)
  })

  it('generates burndown data', async () => {
    getSprintSummary.mockResolvedValueOnce({
      endDate: new Date('2021-12-31'),
      storyPoints: 75,
      columns: {
        'Cold Lead': { storyPoints: 5 },
        'Hot Lead': { storyPoints: 10 },
        'Evaluating Needs': { storyPoints: 15 },
        'Finalizing Contract': { storyPoints: 20 },
        'Completed Sale': { storyPoints: 25 },
      },
    })
    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/').send()

    const chartData = createChart.mock.calls[0][0]

    expect(chartData).toHaveLength(10)
    expect(chartData).toContainEqual({
      c: 'Cold Lead',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).toContainEqual({
      c: 'Hot Lead',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).toContainEqual({
      c: 'Evaluating Needs',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).toContainEqual({
      c: 'Finalizing Contract',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).toContainEqual({
      c: 'Completed Sale',
      x: new Date('2021-12-31'),
      y: 75,
    })
  })

  it('does not generate burndown data for past endDates', async () => {
    jest.setSystemTime(new Date('2022-01-01'))
    getSprintSummary.mockResolvedValueOnce({
      endDate: new Date('2021-12-31'),
      storyPoints: 75,
      columns: {
        'Cold Lead': { storyPoints: 5 },
        'Hot Lead': { storyPoints: 10 },
        'Evaluating Needs': { storyPoints: 15 },
        'Finalizing Contract': { storyPoints: 20 },
        'Completed Sale': { storyPoints: 25 },
      },
    })
    getHistoricalSprintData.mockResolvedValueOnce([])

    await request(BurndownRoute).get('/').send()

    const chartData = createChart.mock.calls[0][0]

    expect(chartData).toHaveLength(5)
    expect(chartData).not.toContainEqual({
      c: 'Cold Lead',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).not.toContainEqual({
      c: 'Hot Lead',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).not.toContainEqual({
      c: 'Evaluating Needs',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).not.toContainEqual({
      c: 'Finalizing Contract',
      x: new Date('2021-12-31'),
      y: 0,
    })
    expect(chartData).not.toContainEqual({
      c: 'Completed Sale',
      x: new Date('2021-12-31'),
      y: 75,
    })
  })

  it('combines historical, current, and burndown data', async () => {
    getSprintSummary.mockResolvedValueOnce({
      endDate: new Date('2021-12-31'),
      storyPoints: 15,
      columns: {
        'To Do': { storyPoints: 5 },
        Done: { storyPoints: 10 },
      },
    })
    getHistoricalSprintData.mockResolvedValueOnce([
      { c: 'To Do', x: new Date('2021-01-01'), y: 15 },
      { c: 'Done', x: new Date('2021-01-01'), y: 0 },
      { c: 'To Do', x: new Date('2021-02-01'), y: 10 },
      { c: 'Done', x: new Date('2021-02-01'), y: 5 },
    ])

    await request(BurndownRoute).get('/').send()

    expect(createChart).toHaveBeenCalledWith(
      [
        { c: 'To Do', x: new Date('2021-01-01'), y: 15 },
        { c: 'Done', x: new Date('2021-01-01'), y: 0 },
        { c: 'To Do', x: new Date('2021-02-01'), y: 10 },
        { c: 'Done', x: new Date('2021-02-01'), y: 5 },
        { c: 'To Do', x: expect.anything(), y: 5 },
        { c: 'Done', x: expect.anything(), y: 10 },
        { c: 'To Do', x: new Date('2021-12-31'), y: 0 },
        { c: 'Done', x: new Date('2021-12-31'), y: 15 },
      ],
      expect.anything(),
    )
  })

  it('returns chart content', async () => {
    getSprintSummary.mockResolvedValueOnce({ columns: {} })
    getHistoricalSprintData.mockResolvedValueOnce([])
    createChart.mockResolvedValueOnce('<svg>with stuff in it</svg>')

    const res = await request(BurndownRoute).get('/').send()

    expect(res.body.toString('utf-8')).toBe('<svg>with stuff in it</svg>')
  })

  it('sets an SVG content-type', async () => {
    getSprintSummary.mockResolvedValueOnce({ columns: {} })
    getHistoricalSprintData.mockResolvedValueOnce([])
    createChart.mockResolvedValueOnce('<svg>with stuff in it</svg>')

    const res = await request(BurndownRoute).get('/').send()

    expect(res.headers['content-type']).toBe('image/svg+xml; charset=utf-8')
  })

  it('emits PublicErrors as they are', async () => {
    getSprintSummary.mockImplementation(async () => {
      throw new PublicError({
        message: ':ohno:',
        status: StatusCodes.UNPROCESSABLE_ENTITY,
      })
    })
    const res = await request(BurndownRoute).get('/').send()
    expect(res.status).toBe(422)
    expect(res.text).toBe(':ohno:')
  })

  it('processes other errors into PublicErrors', async () => {
    getSprintSummary.mockImplementation(async () => {
      throw new Error("👋 It's me, your bearer token.")
    })
    const res = await request(BurndownRoute).get('/').send()
    expect(res.status).toBe(500)
    expect(res.text).toBe('An error occurred while processing your request')
  })
})
