process.env.GITHUB_TOKEN = 'a1b2c3d4e5'

import { Octokit } from '@octokit/rest'
jest.mock('@octokit/rest')
import env from '../EnvService'

import octokit from '../OctokitService'

// trigger the esmodule import
console.log(octokit)

describe('OctokitService', () => {
  it('sets a baseURL', () => {
    expect(Octokit).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: env.GITHUB_API_URL,
      }),
    )
  })

  it('sets a token', () => {
    expect(Octokit).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: 'a1b2c3d4e5',
      }),
    )
  })
})
