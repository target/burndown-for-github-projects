import octokit from './OctokitService'
import PublicError from '../models/PublicError'
import {
  GithubIssue,
  GithubLabel,
  GithubProject,
  GithubProjectCard,
  GithubProjectColumn,
} from '../types/Github'
import env from './EnvService'
import { StatusCodes } from 'http-status-codes'

const getSprintBoard = async (
  organizationName: string,
  sprintId?: number,
): Promise<SprintBoard> => {
  const sprintBoards = await getSprintBoards(organizationName)

  if (!sprintBoards.length) {
    throw new PublicError({
      message: 'No active sprints were found. Validate project is not closed',
      status: StatusCodes.NOT_FOUND,
    })
  }

  if (sprintId) {
    const sprintById = sprintBoards.find(({ number }) => number === sprintId)
    if (!sprintById) {
      throw new PublicError({
        message: `No active sprint was found by ID ${sprintId}. Validate project 1) name matches "${env.GITHUB_PROJECT_REGEX}"; 2) is not closed`,
        status: StatusCodes.NOT_FOUND,
      })
    }
    return sprintById
  } else {
    const firstActiveSprint = sprintBoards[0]
    return firstActiveSprint
  }
}

export interface SprintSummary {
  id: number
  endDate: Date
  storyPoints: number
  columns: {
    [k: string]: SprintBoardColumnCardCollection
  }
}

export const getSprintSummary = async (
  organizationName: string,
  sprintId?: number,
): Promise<SprintSummary> => {
  const currentSprint = await getSprintBoard(organizationName, sprintId)
  const currentSprintStoryPoints = await getSprintStoryPoints(currentSprint)
  return {
    id: currentSprint.number,
    endDate: currentSprint.endDate,
    ...currentSprintStoryPoints,
  }
}

const getSprintStoryPoints = async (sprint: SprintBoard) => {
  const projectColumns = await getSprintColumns(sprint)

  const storyPoints = sumArrayProperties(
    Object.values(projectColumns),
    'storyPoints',
  )

  return {
    storyPoints,
    columns: projectColumns,
  }
}

interface SprintBoard extends GithubProject {
  endDate: Date
}

const getProjects = async (githubOrganization: string) => {
  const { data: projects } = await octokit.projects.listForOrg({
    org: githubOrganization,
    per_page: 100,
  })
  return projects
}

const getSprintBoards = async (organizationName: string) => {
  const projects = await getProjects(organizationName)

  const sprintHeaderRegex = new RegExp(env.GITHUB_PROJECT_REGEX, 'i')
  const sprintBoards = projects
    .map((project) => {
      const headerMatch = sprintHeaderRegex.exec(project.name)

      if (!headerMatch) {
        // Not a sprint board
        return project
      }

      const endDateStr = headerMatch.groups.end_date
      const endDate = new Date(endDateStr)

      const sprint: SprintBoard = {
        ...project,
        endDate,
      }

      return sprint
    })
    .filter(
      (project: GithubProject | SprintBoard): project is SprintBoard =>
        !!(project as SprintBoard).endDate,
    )
    .sort(({ endDate: a }, { endDate: b }) => {
      if (a > b) return 1
      if (a < b) return -1
      return 0
    })

  return sprintBoards
}

const getIssueFromCard = async (card: GithubProjectCard) => {
  const issueUrlRegex = /\/issues\/\d+$/i
  if (!issueUrlRegex.test(card.content_url)) {
    return
  }
  const { data: issue }: { data: GithubIssue } = await octokit.request(
    `GET ${card.content_url}`,
  )

  return issue
}

const getIssueStoryPoints = (issue: GithubIssue) => {
  const pointsLabel = issue.labels
    .map(({ name }: GithubLabel) => name)
    .find((label) => /^\d+$/.test(label))
  if (pointsLabel) {
    const points = Number(pointsLabel)
    return points
  }
}

const getSprintColumns = async (sprint: SprintBoard) => {
  const { data: sprintColumns } = await octokit.projects.listColumns({
    project_id: sprint.id,
  })

  const hydratedSprintColumns = await Promise.all(
    sprintColumns.map(
      async (
        projectColumn,
      ): Promise<[string, SprintBoardColumnCardCollection]> => [
        projectColumn.name,
        await getSprintColumnCards(projectColumn),
      ],
    ),
  )

  const out = createObjectFromEntryArray(hydratedSprintColumns)
  return out
}

const createObjectFromEntryArray = <ObjectEntryArray extends [string, any][]>(
  entries: ObjectEntryArray,
): {
  [k in (typeof entries)[number][0]]: (typeof entries)[number][1]
} =>
  entries.reduce(
    (output: any, [key, value]: [string, any]) => ({
      ...output,
      [key]: value,
    }),
    {},
  )

interface SprintBoardColumnCardCollection {
  storyPoints: number
  cards: SprintBoardCard[]
}

interface SprintBoardCard extends GithubProjectCard {
  issue: GithubIssue
  storyPoints: number
}

const getSprintColumnCards = async (
  projectColumn: GithubProjectColumn,
): Promise<SprintBoardColumnCardCollection> => {
  const { data: cards } = await octokit.projects.listCards({
    column_id: projectColumn.id,
    per_page: 100,
  })

  const hydratedCards = await Promise.all(
    cards.map(async (card): Promise<SprintBoardCard> => {
      const issue = await getIssueFromCard(card)

      let storyPoints = 0
      if (issue) {
        storyPoints = getIssueStoryPoints(issue)
      }

      return {
        storyPoints,
        issue,
        ...card,
      }
    }),
  )

  const storyPoints = sumArrayProperties(hydratedCards, 'storyPoints')

  return {
    storyPoints,
    cards: hydratedCards,
  }
}

type MapObject = Record<string, any>

const sumArrayProperties = (
  arrayOfObjects: MapObject[],
  propertyPath: string,
) =>
  arrayOfObjects.reduce((total, item) => {
    const points = Number(getProperty(item, propertyPath) || 0)
    return points + total
  }, 0)

const getProperty = (obj: MapObject, propertyPath: string) =>
  propertyPath.split('.').reduce((obj, propertyName) => obj[propertyName], obj)
