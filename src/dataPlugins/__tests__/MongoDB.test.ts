import { DBChartPoint } from '../../types/MongoDBPlugin'
import MongoDBPlugin from '../MongoDB'

const mockCollection = {
  find: jest.fn(() => ({
    toArray: () => [
      {
        _id: '1',
        sprint: 'octocat-107',
        x: '2023-03-25T03:02:02.315Z',
        y: 5,
        c: 'To Do',
      },
      {
        _id: '2',
        sprint: 'octocat-107',
        x: '2023-03-25T03:02:02.315Z',
        y: 13,
        c: 'In Progress',
      },
      {
        _id: '3',
        sprint: 'octocat-107',
        x: '2023-03-25T03:02:02.315Z',
        y: 3,
        c: 'In Review',
      },
      {
        _id: '4',
        sprint: 'octocat-107',
        x: '2023-03-25T03:02:02.315Z',
        y: 3,
        c: 'Done',
      },
    ],
  })),
  insertMany: jest.fn(),
}

const mockDb = {
  listCollections: jest.fn(),
  createCollection: jest.fn(),
  collection: jest.fn().mockReturnValue(mockCollection),
}

const mockClient = {
  db: jest.fn().mockReturnValue(mockDb),
  collection: jest.fn(),
}

jest.mock('mongodb', () => {
  return {
    MongoClient: () => {
      return {
        connect: () => {
          return mockClient
        },
      }
    },
  }
})

const mockConfig = {
  user: 'burndown',
  password: 'wedidntstartthefire',
  host: 'https://www.example.com',
  port: '8080',
  databaseName: 'burndown',
  authenticationDatabase: 'admin',
  replicaSet: 'rs0',
  collection: 'burndown',
}

describe('MongoDB Plugin', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('connect sets the client and collections properties', async () => {
    const mongoDBPlugin = new MongoDBPlugin(mockConfig)

    expect(mongoDBPlugin.client).toBeNull()
    expect(mongoDBPlugin.collection).toBeNull()

    const result = await mongoDBPlugin.connect()

    expect(mongoDBPlugin.client).toBe(mockClient)
    expect(mongoDBPlugin.collection).toBe(mockCollection)
    expect(result).toBe(mockCollection)
  })

  it('returns document for sprint', async () => {
    const mongoDBPlugin = new MongoDBPlugin(mockConfig)
    const result = await mongoDBPlugin.get({ sprint: 'octocat-107' })

    expect(Object.entries(result).length).toBe(4)
  })

  it('saves new document', async () => {
    const mongoDBPlugin = new MongoDBPlugin(mockConfig)

    const mockNewSprintData = [
      { x: new Date('2023-04-01T03:02:02.315Z'), y: 99, c: 'To Do' },
      { x: new Date('2023-04-01T03:02:02.315Z'), y: 0, c: 'In Progress' },
      { x: new Date('2023-04-01T03:02:02.315Z'), y: 0, c: 'In Review' },
      { x: new Date('2023-04-01T03:02:02.315Z'), y: 0, c: 'Done' },
    ]

    const expectedNewSprintData: DBChartPoint[] = [
      {
        _id: undefined,
        sprint: 'octocat-108',
        x: new Date('2023-04-01T03:02:02.315Z'),
        y: 99,
        c: 'To Do',
      },
      {
        _id: undefined,
        sprint: 'octocat-108',
        x: new Date('2023-04-01T03:02:02.315Z'),
        y: 0,
        c: 'In Progress',
      },
      {
        _id: undefined,
        sprint: 'octocat-108',
        x: new Date('2023-04-01T03:02:02.315Z'),
        y: 0,
        c: 'In Review',
      },
      {
        _id: undefined,
        sprint: 'octocat-108',
        x: new Date('2023-04-01T03:02:02.315Z'),
        y: 0,
        c: 'Done',
      },
    ]

    await mongoDBPlugin.set({
      sprint: 'octocat-108',
      newData: mockNewSprintData,
    })

    expect(mockCollection.insertMany).toHaveBeenCalledWith(
      expectedNewSprintData
    )
  })
})
