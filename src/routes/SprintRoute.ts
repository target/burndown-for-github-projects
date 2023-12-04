import { Router } from 'express'
import { getSprintSummary } from '../services/SprintPointService'
import env from '../services/EnvService'
import PublicError from '../models/PublicError'

const SprintRoute = Router()

SprintRoute.get('/:id?', async (req, res) => {
  let sprintId: number
  if (req.params.id) {
    sprintId = Number(req.params.id)
  }

  const organization =
    (req.query.organization_name as string) ||
    env.GITHUB_DEFAULT_ORGANIZATION_NAME

  try {
    const sprintSummary = await getSprintSummary(organization, sprintId)

    return res.json({
      ...sprintSummary,
      columns: Object.entries(sprintSummary.columns).reduce(
        (agg, [k, v]) => ({
          ...agg,
          [k]: v.storyPoints,
        }),
        {},
      ),
    })
  } catch (err) {
    if (!(err instanceof PublicError)) {
      err = new PublicError(err)
    }
    return err.handle(res)
  }
})

export default SprintRoute
