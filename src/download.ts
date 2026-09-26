import { strToU8, zipSync, type Zippable } from 'fflate'
import type { Project } from './model/types.ts'
import { getAsset } from './db.ts'
import codeRules from '../skills/code-rules/SKILL.md?raw'
import behavior from '../skills/behavior/SKILL.md?raw'
import content from '../skills/content/SKILL.md?raw'
import visualStyle from '../skills/visual-style/SKILL.md?raw'
import layout from '../skills/layout/SKILL.md?raw'

const SKILLS: Record<string, string> = {
  'code-rules': codeRules,
  layout,
  behavior,
  content,
  'visual-style': visualStyle,
}

function kitAgents(project: Pick<Project, 'name' | 'files'>): string {
  const builds = Object.keys(project.files)
    .map(path => ({ path, n: Number(/^\.builds\/build-(\d+)\.md$/.exec(path)?.[1]) }))
    .filter(b => b.n)
    .sort((a, b) => a.n - b.n)
  const plan = builds.length
    ? builds.map(b => `### Build ${b.n}\n\n${project.files[b.path].trimEnd()}`).join('\n\n')
    : 'No Build yet.'
  return `# ${project.name}

A website made with Scrabby. Bob built it from a plan of Blocks and Traits. The plan Bob read for each Build is at the end of this file.

## Rules for Bob

- Plain HTML, CSS and JavaScript: one \`.html\` file per page, a shared \`base.css\`, \`style.css\` and \`script.js\`, images and videos in \`assets/\`. No build step, no npm, no frameworks.
- Keep every \`data-block="…"\` attribute and every \`/* block … */\` comment. They tie the code to the Blocks it came from.
- Change only what is asked. Keep all other code as it is, including the user's own edits.
- Follow the Skills in \`.bob/skills/\`: code rules, layout, behavior, content and visual style.

## The plan

${plan}
`
}

export function zipDownload(
  project: Pick<Project, 'name' | 'files'>,
  assets: { file: string; data: Uint8Array }[],
): Uint8Array {
  const zip: Zippable = {}
  for (const [path, text] of Object.entries(project.files)) {
    if (!path.startsWith('.builds/')) zip[path] = strToU8(text)
  }
  // Images and videos are already compressed.
  for (const a of assets) zip[`assets/${a.file}`] = [a.data, { level: 0 }]
  zip['AGENTS.md'] = strToU8(kitAgents(project))
  for (const [name, text] of Object.entries(SKILLS)) zip[`.bob/skills/${name}/SKILL.md`] = strToU8(text)
  return zipSync(zip)
}

export async function downloadCode(project: Project): Promise<void> {
  const assets: { file: string; data: Uint8Array }[] = []
  for (const a of project.assets) {
    const stored = await getAsset(project.id, a.id)
    if (!stored) { console.warn(`Asset ${a.file} has no saved file; left out of the download`); continue }
    assets.push({ file: a.file, data: new Uint8Array(await stored.blob.arrayBuffer()) })
  }
  const blob = new Blob([zipDownload(project, assets) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name.replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'my-site'}.zip`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
