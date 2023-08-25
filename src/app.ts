import cron from 'node-cron'
import express from 'express'
import cors from 'cors'
import { json as jsonParser } from 'body-parser'

import routes from './routes'
import env from './services/EnvService'
import { fetchSprintData } from './services/HistoricalDataService'

// Create server
const app = express()

// Apply middleware
app.use(jsonParser())
app.use(cors())
app.use(routes)

// 🙂|>--------<|🙂
app.listen(env.PORT, () => {
  console.log('Server available on port %s', env.PORT)
})

// Start data gathering
cron.schedule(
  env.CRON_SCHEDULE,
  async () => {
    try {
      await fetchSprintData()
    } catch (err) {
      console.error('Error fetching sprint data. Error Name: %s', err?.name)
    }
  },
  {
    timezone: env.CRON_TIMEZONE,
  }
)
