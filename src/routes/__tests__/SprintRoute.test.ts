import SprintRoute from '../SprintRoute'
import { request } from './utils'
import { getSprintSummary as baseGetSprintSummary } from '../../services/SprintPointService'
import * as env from '../../services/EnvService'
import PublicError from '../../models/PublicError'
import { StatusCodes } from 'http-status-codes'

const getSprintSummary = baseGetSprintSummary as jest.Mock

jest.mock('../../services/SprintPointService')
jest.mock('../../services/EnvService', () => ({}))

describe('SprintRoute', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('can be called with no sprint ID', async () => {
    getSprintSummary.mockResolvedValue({
      foo: 'bar 1',
      columns: {},
    })

    const res = await request(SprintRoute).get('/').send()

    expect(getSprintSummary).toHaveBeenCalledWith(undefined, undefined)
    expect(res.body).toStrictEqual({
      foo: 'bar 1',
      columns: {},
    })
  })

  it('can be called with a sprint ID', async () => {
    getSprintSummary.mockResolvedValue({
      foo: 'bar 2',
      columns: {},
    })

    const res = await request(SprintRoute).get('/123').send()

    expect(getSprintSummary).toHaveBeenCalledWith(undefined, 123)
    expect(res.body).toStrictEqual({
      foo: 'bar 2',
      columns: {},
    })
  })

  it('accepts an organization_name query parameter', async () => {
    env.default.GITHUB_DEFAULT_ORGANIZATION_NAME = 'The-Even-Cooler-Kids'
    getSprintSummary.mockResolvedValue({
      foo: 'bar 3',
      columns: {},
    })

    const res = await request(SprintRoute)
      .get('/?organization_name=The-Cool-Kids')
      .send()

    expect(getSprintSummary).toHaveBeenCalledWith('The-Cool-Kids', undefined)
    expect(res.body).toStrictEqual({
      foo: 'bar 3',
      columns: {},
    })
  })

  it('applies the default organization name', async () => {
    env.default.GITHUB_DEFAULT_ORGANIZATION_NAME = 'The-Even-Cooler-Kids'
    getSprintSummary.mockResolvedValue({
      foo: 'bar 4',
      columns: {},
    })

    const res = await request(SprintRoute).get('/').send()

    expect(getSprintSummary).toHaveBeenCalledWith(
      'The-Even-Cooler-Kids',
      undefined,
    )
    expect(res.body).toStrictEqual({
      foo: 'bar 4',
      columns: {},
    })
  })

  it('emits PublicErrors as they are', async () => {
    getSprintSummary.mockImplementation(async () => {
      throw new PublicError({
        message: ':ohno:',
        status: StatusCodes.UNPROCESSABLE_ENTITY,
      })
    })

    const res = await request(SprintRoute).get('/').send()

    expect(res.status).toBe(422)
    expect(res.text).toBe(':ohno:')
  })

  it('processes other errors into PublicErrors', async () => {
    getSprintSummary.mockImplementation(async () => {
      throw new Error("This is something you don't want your users to know")
    })

    const res = await request(SprintRoute).get('/').send()

    expect(res.status).toBe(500)
    expect(res.text).toBe('An error occurred while processing your request')
  })

  it('cuts out excess column information', async () => {
    getSprintSummary.mockResolvedValue({
      foo: 'bar 1',
      columns: {
        'To Do': {
          storyPoints: 10,
          stories: ['The Hobbit'],
        },
        'In Progress': {
          storyPoints: 12,
          movies: ['The Hobbit'],
        },
        Done: {
          storyPoints: 30,
          favoriteDndCharacter: ['The Hobbit'],
        },
      },
    })

    const res = await request(SprintRoute).get('/').send()
    expect(res.body).toStrictEqual({
      foo: 'bar 1',
      columns: {
        'To Do': 10,
        'In Progress': 12,
        Done: 30,
      },
    })
  })
})
