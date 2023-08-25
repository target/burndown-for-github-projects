import HealthRoute from '../HealthRoute'
import { request } from './utils'

describe('HealthRoute', () => {
  it('has a GET / that returns a friendly greeting', async () => {
    const res = await request(HealthRoute).get('/').send()

    expect(res.status).toBe(200)
    expect(res.text).toContain('Hey')
  })
})
