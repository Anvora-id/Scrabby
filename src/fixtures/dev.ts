import { demoProject, builtSite } from './fixtures.ts'
import { replaceProject } from '../onboarding.ts'

export const FIXTURES: Record<string, string> = {
  demo: 'Demo plan (spec §7)',
  built: 'Built site (2 Checkpoints)',
}

export async function loadFixture(name: string): Promise<void> {
  if (name === 'demo') {
    await replaceProject(demoProject())
  } else if (name === 'built') {
    const { project, checkpoints } = builtSite()
    await replaceProject(project, checkpoints)
  }
}
