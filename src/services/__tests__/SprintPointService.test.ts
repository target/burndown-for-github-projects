import { getSprintSummary } from '../SprintPointService'

// Prevent local env file from being loaded
jest.mock('dotenv')

import baseOctokit from '../OctokitService'
jest.mock('../OctokitService')

const octokit = {
  projects: {
    listForOrg: (baseOctokit.projects.listForOrg as unknown) as jest.Mock,
    listColumns: (baseOctokit.projects.listColumns as unknown) as jest.Mock,
    listCards: (baseOctokit.projects.listCards as unknown) as jest.Mock,
  },
  request: (baseOctokit.request as unknown) as jest.Mock,
}

describe('SprintPointService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    octokit.projects.listColumns.mockResolvedValue({
      data: [],
    })
    octokit.projects.listForOrg.mockResolvedValue({
      data: [],
    })
    octokit.projects.listCards.mockResolvedValue({
      data: [],
    })
    octokit.request.mockResolvedValue({ data: null })
  })

  it('loads projects for the provided org', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [
        { name: 'Sprint 123 - 01/01/2021', number: 5, id: 1 },
        { name: 'Sprint 124 - 02/01/2021', number: 6, id: 2 },
        { name: 'Sprint 125 - 03/01/2021', number: 7, id: 3 },
      ],
    })
    await getSprintSummary('Test-Org')

    expect(octokit.projects.listForOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        org: 'Test-Org',
      })
    )
  })

  it('throws if no projects were found', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [
        { name: 'Not a sprint', number: 5, id: 1 },
        { name: 'Also not a sprint', number: 6, id: 2 },
        { name: 'Still not a sprint', number: 7, id: 3 },
      ],
    })

    expect(async () => {
      await getSprintSummary('Test-Org')
    }).rejects.toThrowErrorMatchingInlineSnapshot(
      `"No active sprints were found. Validate project is not closed"`
    )
  })

  it('locates the current sprint', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [
        { name: 'Not a sprint', number: 4, id: 0 },
        { name: 'Sprint 123 - 01/01/2021', number: 5, id: 1 },
        { name: 'Sprint 124 - 02/01/2021', number: 6, id: 2 },
        { name: 'Sprint 125 - 03/01/2021', number: 7, id: 3 },
      ],
    })
    const { id, endDate } = await getSprintSummary('My-Org')

    expect(id).toBe(5)
    expect(endDate).toStrictEqual(new Date('01/01/2021'))
  })

  it('locates a sprint by number', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [
        { name: 'Not a sprint', number: 4, id: 0 },
        { name: 'Sprint 123 - 01/01/2021', number: 5, id: 1 },
        { name: 'Sprint 124 - 02/01/2021', number: 6, id: 2 },
        { name: 'Sprint 125 - 03/01/2021', number: 7, id: 3 },
      ],
    })
    const { id, endDate } = await getSprintSummary('My-Org', 7)

    expect(id).toBe(7)
    expect(endDate).toStrictEqual(new Date('03/01/2021'))
  })

  it('throws if no sprint is located by number', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [
        { name: 'Not a sprint', number: 4, id: 0 },
        { name: 'Sprint 123 - 01/01/2021', number: 5, id: 1 },
        { name: 'Sprint 124 - 02/01/2021', number: 6, id: 2 },
        { name: 'Sprint 125 - 03/01/2021', number: 7, id: 3 },
      ],
    })

    expect(async () => {
      await getSprintSummary('My-Org', 12)
    }).rejects.toMatchInlineSnapshot(
      `[PublicError: No active sprint was found by ID 12. Validate project 1) name matches "Sprint \\d+ - (?<end_date>\\d+/\\d+/\\d+)"; 2) is not closed]`
    )
  })

  it('gets columns for a resolved sprint', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })

    await getSprintSummary('Test-Org')

    expect(octokit.projects.listColumns).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 321,
      })
    )
  })

  it('fetches issues in all project columns', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [
        { name: 'To Do', id: 1 },
        { name: 'Done', id: 2 },
      ],
    })

    octokit.projects.listCards.mockResolvedValue({ data: [] })

    await getSprintSummary('Test-Org')

    expect(octokit.projects.listCards).toHaveBeenCalledTimes(2)
    expect(octokit.projects.listCards).toHaveBeenCalledWith(
      expect.objectContaining({ column_id: 1 })
    )
    expect(octokit.projects.listCards).toHaveBeenCalledWith(
      expect.objectContaining({ column_id: 2 })
    )
  })

  it('fetches card data', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [{ name: 'The one, the only', id: 1 }],
    })
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/123' },
        { content_url: 'foo.bar/issues/124' },
      ],
    })

    octokit.request.mockResolvedValue({ data: null })

    await getSprintSummary('Test-Org')

    expect(octokit.request).toHaveBeenCalledWith('GET foo.bar/issues/123')
    expect(octokit.request).toHaveBeenCalledWith('GET foo.bar/issues/124')
  })

  it('does not fetch non-issues', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [{ name: 'The one, the only', id: 1 }],
    })
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/123' },
        { content_url: 'foo.bar/issues/124' },
        { content_url: 'foo.bar/issues/125' },
        { content_url: 'foo.bar/note/100' },
        { content_url: 'foo.bar/note/101' },
      ],
    })
    octokit.request.mockResolvedValue({ data: null })

    await getSprintSummary('Test-Org')

    expect(octokit.request).toHaveBeenCalledTimes(3)
    expect(octokit.request).not.toHaveBeenCalledWith('GET foo.bar/note/100')
    expect(octokit.request).not.toHaveBeenCalledWith('GET foo.bar/note/101')
  })

  it('unfurls story points from issues', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [{ name: 'The one, the only', id: 1 }],
    })
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/123' },
        { content_url: 'foo.bar/issues/124' },
      ],
    })
    octokit.request.mockResolvedValueOnce({
      data: {
        labels: [{ name: '1' }],
      },
    })
    octokit.request.mockResolvedValueOnce({
      data: {
        labels: [{ name: '5' }],
      },
    })

    const { storyPoints } = await getSprintSummary('Test-Org')

    expect(storyPoints).toBe(6)
  })

  it('takes the first story point label', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [{ name: 'The one, the only', id: 1 }],
    })
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [{ content_url: 'foo.bar/issues/123' }],
    })
    octokit.request.mockResolvedValueOnce({
      data: {
        labels: [{ name: '8' }, { name: '1' }],
      },
    })

    const { storyPoints } = await getSprintSummary('Test-Org')

    expect(storyPoints).toBe(8)
  })

  it('ignores non-int story point labels', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [{ name: 'The one, the only', id: 1 }],
    })
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [{ content_url: 'foo.bar/issues/123' }],
    })
    octokit.request.mockResolvedValueOnce({
      data: {
        labels: [
          { name: '8 - Definitely a story point' }, // it's not
          { name: '1' },
        ],
      },
    })

    const { storyPoints } = await getSprintSummary('Test-Org')

    expect(storyPoints).toBe(1)
  })

  it('aggregates story points', async () => {
    octokit.projects.listForOrg.mockResolvedValueOnce({
      data: [{ name: 'Sprint 123 - 01/01/2021', number: 123, id: 321 }],
    })
    octokit.projects.listColumns.mockResolvedValueOnce({
      data: [
        { name: 'To Do', id: 1 },
        { name: 'In Progress', id: 1 },
        { name: 'Done', id: 1 },
      ],
    })
    // To Do
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/1' },
        { content_url: 'foo.bar/issues/2' },
        { content_url: 'foo.bar/issues/3' },
      ],
    })
    // In Progress
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/4' },
        { content_url: 'foo.bar/issues/5' },
        { content_url: 'foo.bar/issues/6' },
      ],
    })
    // Done
    octokit.projects.listCards.mockResolvedValueOnce({
      data: [
        { content_url: 'foo.bar/issues/7' },
        { content_url: 'foo.bar/issues/8' },
        { content_url: 'foo.bar/issues/9' },
      ],
    })

    const points: { [k: string]: number } = {
      'foo.bar/issues/1': 1,
      'foo.bar/issues/2': 3,
      'foo.bar/issues/3': 3,
      'foo.bar/issues/4': 2,
      'foo.bar/issues/5': 13,
      'foo.bar/issues/6': 8,
      'foo.bar/issues/7': 3,
      'foo.bar/issues/8': 5,
      'foo.bar/issues/9': 1,
    }

    octokit.request.mockImplementation(
      async (
        requestPath: `GET foo.bar/issues/${number}`
      ): Promise<{
        data: { labels: { name: number }[] }
      }> => ({
        data: {
          labels: [{ name: points[requestPath.replace('GET ', '')] }],
        },
      })
    )

    const { storyPoints, columns } = await getSprintSummary('Test-Org')

    expect(columns['To Do'].storyPoints).toBe(7)
    expect(columns['In Progress'].storyPoints).toBe(23)
    expect(columns['Done'].storyPoints).toBe(9)
    expect(storyPoints).toBe(39)
  })
})
