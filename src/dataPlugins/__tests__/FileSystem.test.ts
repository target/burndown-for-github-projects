import FileSystem from '../FileSystem'
import fs from 'fs-extra'
jest.mock('fs-extra')

describe('FileSystem Plugin', () => {
  beforeEach(() => {
    process.cwd = jest.fn().mockImplementation(() => '/tests')
    fs.existsSync = jest.fn().mockReturnValue(true)
    jest.mocked(fs.readFile).mockImplementation(
      () =>
        `{
          "cf54f993-c3df-458e-b895-9e1446d7f7c2": {
            "x": "2022-04-29T19:38:01.663Z",
            "y": 15,
            "c": "To do",
            "sprint": "octocat-107"
          },
          "a0c6f981-2c0f-4f9a-8ef5-f60b2d696424": {
            "x": "2022-04-29T19:38:01.663Z",
            "y": 34,
            "c": "In progress",
            "sprint": "octocat-107"
          },
          "dddbb762-c7d8-4e27-8ab2-4d18ca75b56b": {
            "x": "2022-04-29T19:38:01.663Z",
            "y": 11,
            "c": "PR open",
            "sprint": "octocat-107"
          },
          "d19876e0-97f9-4f28-86a5-18ac09eb0b70": {
            "x": "2022-04-29T19:38:01.663Z",
            "y": 56,
            "c": "Done",
            "sprint": "octocat-107"
          }
      }`,
    )
  })

  it('returns the provided path of the local JSON file upon instantiation', () => {
    const fileSystem = new FileSystem()
    expect(fileSystem.storageFilePath('octocat-4.json')).toBe(
      '/tests/data/octocat-4.json',
    )
  })

  it('returns the path of the local JSON file upon instantiation even if json extension missing', () => {
    const fileSystem = new FileSystem()
    expect(fileSystem.storageFilePath('octocat-4')).toBe(
      '/tests/data/octocat-4.json',
    )
  })

  it('returns entries for the provided sprint', async () => {
    const fileSystem = new FileSystem()

    const result = await fileSystem.get({ sprint: 'octocat-107' })

    expect(Object.entries(result)).toHaveLength(4)
    expect(result['cf54f993-c3df-458e-b895-9e1446d7f7c2']).toBeDefined()
  })

  it('appends to the storage file', async () => {
    const fileSystem = new FileSystem()

    const now = new Date()

    await fileSystem.set({
      sprint: 'octocat-107',
      newData: [
        {
          x: now,
          y: 13,
          c: 'To do',
        },
        {
          x: now,
          y: 36,
          c: 'In progress',
        },
        {
          x: now,
          y: 11,
          c: 'PR open',
        },
        {
          x: now,
          y: 56,
          c: 'Done',
        },
      ],
    })

    const newFileContents = JSON.parse(
      jest.mocked(fs.writeFile).mock.calls[0][1].toString(),
    ) as Awaited<ReturnType<typeof fileSystem.getRaw>>
    expect(Object.keys(newFileContents)).toHaveLength(8)
    expect(
      Object.values(newFileContents)
        .map(({ y }) => y)
        .slice(4),
    ).toStrictEqual([13, 36, 11, 56])
  })
})

type Awaited<T> = T extends PromiseLike<infer U> ? U : T
