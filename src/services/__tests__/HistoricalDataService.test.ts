import { getSprintSummary as baseGetSprintSummary } from '../SprintPointService'
jest.mock('../SprintPointService')
const getSprintSummary = baseGetSprintSummary as jest.Mock

import { mapSprintToChartPoints as baseMapSprintToChartPoints } from '../ChartService'
jest.mock('../ChartService')
const mapSprintToChartPoints = baseMapSprintToChartPoints as jest.Mock

import env from '../EnvService'

import {
  getHistoricalSprintData,
  fetchSprintData,
} from '../HistoricalDataService'

import { getDataPlugin } from '../../utils/getDataPlugin'

jest.mock('../../utils/getDataPlugin', () => ({
  getDataPlugin: jest.fn(),
}))

const mockGet = jest.fn()
const mockSet = jest.fn()
const mockGetDataPlugin = getDataPlugin as jest.Mock

describe('HistoricalDataService', () => {
  beforeEach(() => {
    mockGet.mockReturnValue({})
    mockGetDataPlugin.mockReturnValue({
      get: mockGet,
      set: mockSet,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('gets the sprint summary for the default org', async () => {
    getSprintSummary.mockImplementation(async () => ({
      id: 123,
      columns: [],
    }))
    mapSprintToChartPoints.mockReturnValueOnce([])

    await fetchSprintData()

    expect(getSprintSummary).toHaveBeenCalledWith(
      env.GITHUB_DEFAULT_ORGANIZATION_NAME
    )
  })

  it('reads data from the dataPlugin', async () => {
    await getHistoricalSprintData('123')

    expect(mockGet).toHaveBeenCalled()
  })
})
