export interface PreviewFiles { projectId: string; files: Record<string, string>; assets: { path: string; blob: Blob }[] }

export const NO_FILE_TEXT = 'This page has no file yet.'
export const HELPER = '<script src="/helper.js"></script>'
const NO_FILE_PAGE = `<!doctype html><meta charset="utf-8"><p style="font:16px sans-serif">${NO_FILE_TEXT}</p>`

const TYPES = new Map([
  ['html', 'text/html'], ['css', 'text/css'], ['js', 'text/javascript'], ['json', 'application/json'],
  ['svg', 'image/svg+xml'], ['txt', 'text/plain'], ['md', 'text/plain'],
])

export function typeOf(path: string): string {
  return (TYPES.get(path.split('.').pop()!.toLowerCase()) ?? 'text/plain') + '; charset=utf-8'
}

export function injectHelper(html: string): string {
  const head = /<head(\s[^>]*)?>/i.exec(html)
  if (!head) return HELPER + html
  const end = head.index + head[0].length
  return html.slice(0, end) + HELPER + html.slice(end)
}

// Encodes the path the same way a request's pathname is encoded.
const keyOf = (projectId: string, path: string) => new URL('/preview/' + projectId + '/' + path, 'http://x').pathname

export function toEntries(projectId: string, files: PreviewFiles['files'], assets: PreviewFiles['assets']): [string, Response][] {
  return [
    ...Object.entries(files).map(([path, text]): [string, Response] => [
      keyOf(projectId, path),
      new Response(path.endsWith('.html') ? injectHelper(text) : text, { headers: { 'content-type': typeOf(path) } }),
    ]),
    ...assets.map((a): [string, Response] => [keyOf(projectId, a.path), new Response(a.blob, { headers: { 'content-type': a.blob.type } })]),
  ]
}

export async function answer(pathname: string, lookup: (key: string) => Promise<Response | undefined>): Promise<Response | undefined> {
  if (!/^\/preview\/[^/]+\//.test(pathname)) return undefined
  const key = pathname.endsWith('/') ? pathname + 'index.html' : pathname
  const found = await lookup(key)
  if (found) return found
  if (key.endsWith('.html')) return new Response(injectHelper(NO_FILE_PAGE), { status: 404, headers: { 'content-type': typeOf(key) } })
  return new Response('Not found', { status: 404, headers: { 'content-type': typeOf('') } })
}
