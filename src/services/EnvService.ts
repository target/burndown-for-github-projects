import env from 'dotenv'
import { Timezone } from 'tz-offset'
import { ChartDimensions } from '../types/Chart'

env.config()

type CronSchedule = `${string} ${string} ${string} ${string} ${string}`

type ServerEnvironment = {
  PORT: string
  GITHUB_API_URL: string
  GITHUB_TOKEN: string
  GITHUB_DEFAULT_ORGANIZATION_NAME: string
  GITHUB_PROJECT_REGEX: string
  CHART_DEFAULT_DIMENSIONS: ChartDimensions
  CRON_SCHEDULE: CronSchedule
  CRON_TIMEZONE: Timezone
}

const {
  CHART_DEFAULT_DIMENSIONS = '500x200',
  // https://crontab.guru/#0_6-18/2_*_*_1-5
  CRON_SCHEDULE = '0 6-18/2 * * 1-5',
  // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  CRON_TIMEZONE = 'America/Chicago',
  GITHUB_API_URL = 'https://api.github.com',
  GITHUB_DEFAULT_ORGANIZATION_NAME,
  GITHUB_TOKEN,
  GITHUB_PROJECT_REGEX = 'Sprint \\d+ - (?<end_date>\\d+/\\d+/\\d+)',
  PORT = '8080',
} = process.env as ServerEnvironment

export default {
  PORT,
  GITHUB_API_URL,
  GITHUB_DEFAULT_ORGANIZATION_NAME,
  GITHUB_TOKEN,
  GITHUB_PROJECT_REGEX,
  CHART_DEFAULT_DIMENSIONS,
  CRON_SCHEDULE,
  CRON_TIMEZONE,
}
