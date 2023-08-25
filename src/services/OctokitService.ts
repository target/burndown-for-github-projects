import { Octokit } from '@octokit/rest'
import env from './EnvService'

const octokit = new Octokit({
  baseUrl: env.GITHUB_API_URL,
  auth: env.GITHUB_TOKEN,
})

export default octokit
