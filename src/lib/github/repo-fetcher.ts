import { getOctokit, parseGithubUrl } from './client'

const TEMPLATE_FINGERPRINTS: Record<string, string[]> = {
  'create-react-app': ['src/App.js', 'src/App.test.js', 'public/favicon.ico', 'src/reportWebVitals.js'],
  'next-starter': ['app/layout.tsx', 'app/page.tsx', 'public/next.svg', 'public/vercel.svg'],
  'flask-template': ['app.py', 'requirements.txt', 'templates/base.html'],
  'vite-react': ['src/App.tsx', 'src/main.tsx', 'vite.config.ts', 'src/assets/react.svg'],
  'express-starter': ['bin/www', 'routes/index.js', 'views/layout.jade'],
}

const BOILERPLATE_FILES = new Set([
  '.gitignore', 'LICENSE', 'README.md', '.eslintrc.json',
  'next.config.js', 'next.config.mjs', 'tailwind.config.js',
  'tailwind.config.ts', 'tsconfig.json', 'postcss.config.js',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
])

const INTERESTING_DIRS = ['src/', 'lib/', 'app/', 'components/', 'api/', 'utils/', 'hooks/', 'services/']
const SOURCE_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'swift', 'kt', 'html'])
const PUBLIC_ENTRYPOINTS = new Set(['public/index.html'])

export interface RepoData {
  is_forked: boolean
  file_count: number
  languages: Record<string, number>
  tech_stack: string[]
  template_detected: string | null
  template_confidence: number
  original_code_ratio: number
  commit_count_in_window: number
  commit_authors: string[]
  readme_content: string
  file_tree: string[]
  key_source_files: Array<{ path: string; content: string }>
}

export async function fetchRepoData(githubUrl: string, hackathonDate?: string): Promise<RepoData> {
  const octokit = getOctokit()
  const parsed = parseGithubUrl(githubUrl)
  if (!parsed) throw new Error('Invalid GitHub URL')

  const { owner, repo } = parsed

  // Fetch repo info, languages, tree, commits in parallel
  const [repoInfo, langs, tree, commits] = await Promise.all([
    octokit.repos.get({ owner, repo }),
    octokit.repos.listLanguages({ owner, repo }),
    octokit.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: 'true' }),
    octokit.repos.listCommits({ owner, repo, per_page: 100 }).catch(() => ({ data: [] })),
  ])

  const allFiles = tree.data.tree
    .filter((f) => f.type === 'blob' && f.path)
    .map((f) => f.path!)

  const fileCount = allFiles.length

  // Template detection
  let templateDetected: string | null = null
  let templateConfidence = 0
  const fileSet = new Set(allFiles)
  for (const [tmpl, prints] of Object.entries(TEMPLATE_FINGERPRINTS)) {
    const matched = prints.filter((p) => fileSet.has(p)).length
    const confidence = matched / prints.length
    if (confidence > templateConfidence) {
      templateConfidence = confidence
      templateDetected = confidence > 0.5 ? tmpl : null
    }
  }

  // Original code ratio
  const boilerplateCount = allFiles.filter((f) => {
    const name = f.split('/').pop()!
    return BOILERPLATE_FILES.has(name) || f.startsWith('node_modules/') || f.startsWith('.next/')
  }).length
  const originalCodeRatio = Math.max(0, 1 - boilerplateCount / Math.max(fileCount, 1))

  // Tech stack from languages + package.json
  const languages = langs.data as Record<string, number>
  const techStack = Object.keys(languages)

  // Commits in hackathon window
  const windowStart = hackathonDate
    ? new Date(hackathonDate)
    : new Date(Date.now() - 24 * 60 * 60 * 1000 * 2)
  const windowCommits = commits.data.filter((c) => {
    const date = new Date(c.commit.author?.date || 0)
    return date >= windowStart
  })
  const commitAuthors = Array.from(new Set(windowCommits.map((c) => c.commit.author?.name || 'unknown')))

  // Fetch README
  let readmeContent = ''
  try {
    const { data: readme } = await octokit.repos.getReadme({ owner, repo })
    readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8').slice(0, 3000)
  } catch {}

  // Select key source files
  const interesting = allFiles
    .filter((f) => {
      if (BOILERPLATE_FILES.has(f.split('/').pop()!)) return false
      const ext = f.split('.').pop()
      if (!SOURCE_EXTENSIONS.has(ext || '')) return false
      return (
        INTERESTING_DIRS.some((d) => f.startsWith(d)) ||
        !f.includes('/') ||
        PUBLIC_ENTRYPOINTS.has(f)
      )
    })
    .slice(0, 15)

  const keySourceFiles: Array<{ path: string; content: string }> = []
  for (const path of interesting) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path })
      if ('content' in data && data.type === 'file') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000)
        keySourceFiles.push({ path, content })
      }
    } catch {}
  }

  return {
    is_forked: repoInfo.data.fork,
    file_count: fileCount,
    languages,
    tech_stack: techStack,
    template_detected: templateDetected,
    template_confidence: Math.round(templateConfidence * 100) / 100,
    original_code_ratio: Math.round(originalCodeRatio * 100) / 100,
    commit_count_in_window: windowCommits.length,
    commit_authors: commitAuthors,
    readme_content: readmeContent,
    file_tree: allFiles.slice(0, 200),
    key_source_files: keySourceFiles,
  }
}
