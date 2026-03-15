export interface DevpostData {
  team_name: string | null
  tagline: string | null
  description: string | null
  built_with: string[]
  links: string[]
}

export async function scrapeDevpost(devpostUrl: string): Promise<DevpostData> {
  try {
    const res = await fetch(devpostUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HackathonJudging/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    const teamName = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || null
    const tagline = html.match(/<p[^>]*class="[^"]*tagline[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || null

    // Extract "Built With" badges
    const builtWithMatches = Array.from(html.matchAll(/data-tag="([^"]+)"/g))
    const builtWith = Array.from(new Set(builtWithMatches.map((m) => m[1].toLowerCase())))

    // Extract description text (rough)
    const descMatch = html.match(/<div[^>]*id="app-details-left"[^>]*>([\s\S]*?)<\/div>/)?.[1]
    const description = descMatch
      ? descMatch.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      : null

    return { team_name: teamName, tagline, description, built_with: builtWith, links: [] }
  } catch {
    return { team_name: null, tagline: null, description: null, built_with: [], links: [] }
  }
}
