import { Octokit } from '@octokit/rest'
import { APIResolveType } from './utility'

type GithubApiResolveType<
  category extends keyof Octokit,
  fx extends keyof Octokit[category],
> = Octokit[category][fx] extends (...args: any[]) => any
  ? APIResolveType<ReturnType<Octokit[category][fx]>>
  : never

export type GithubProject = GithubApiResolveType<'projects', 'get'>
export type GithubProjectColumn = GithubApiResolveType<'projects', 'getColumn'>
export type GithubProjectCard = GithubApiResolveType<'projects', 'getCard'>
export type GithubIssue = GithubApiResolveType<'issues', 'get'>
export type GithubLabel = GithubApiResolveType<'issues', 'getLabel'>
