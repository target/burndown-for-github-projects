import dotenv from 'dotenv'
jest.mock('dotenv')
import env from '../EnvService'

describe('EnvService', () => {
  it('loads an env file', () => {
    // Something to trigger the esmodule import
    console.log(env)

    expect(dotenv.config).toHaveBeenCalled()
  })

  it('chart dimensions are formatted correctly', () => {
    expect(env.CHART_DEFAULT_DIMENSIONS).toMatch(/^\d+x\d+$/)
  })

  it('uses US central time', () => {
    expect(env.CRON_TIMEZONE).toBe('America/Chicago')
  })

  it('does not define a github organization name', () => {
    expect(env.GITHUB_DEFAULT_ORGANIZATION_NAME).toBeUndefined()
  })

  it('does not define a github token', () => {
    expect(env.GITHUB_TOKEN).toBeUndefined()
  })

  it('has a working default regexp', () => {
    const test = 'Sprint 123 - 01/01/2021'
    const regex = new RegExp(env.GITHUB_PROJECT_REGEX, 'i')

    const match = regex.exec(test)

    expect(test).toMatch(regex)
    expect(match).toBeTruthy()
    expect(match.groups.end_date).toBe('01/01/2021')
  })

  it('sets up a default cron schedule', () => {
    const [
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    ] = env.CRON_SCHEDULE.split(' ')

    // Top of the hour
    expect(minute).toBe('0')

    // Not at night
    expect(hour).toMatch(/^6-18/)

    // Every 2 hours
    expect(hour).toMatch(/\/2$/)

    // Every day of the month
    expect(dayOfMonth).toBe('*')

    // Every month of the year
    expect(month).toBe('*')

    // Only Monday thru Friday
    const weekdays = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }
    expect(dayOfWeek).toBe(`${weekdays.Monday}-${weekdays.Friday}`)
  })
})
