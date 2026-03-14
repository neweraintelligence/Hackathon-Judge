import { Octokit } from '@octokit/rest'

let _octokit: Octokit | null = null

export function getOctokit(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  }
  return _octokit
}

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim())
    const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/')
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return null
  }
}
