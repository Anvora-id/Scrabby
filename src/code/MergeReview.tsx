import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { getChunks, getOriginalDoc, unifiedMergeView } from '@codemirror/merge'
import { setup } from './setup.ts'
import styles from './editor.module.css'

interface Props {
  path: string
  code: string
  proposed: string
  onDecide: (code: string, chunks: number, proposed: string) => void
}

function mergeControls(type: 'accept' | 'reject', action: (e: MouseEvent) => void): HTMLElement {
  const b = document.createElement('button')
  b.className = type === 'accept' ? 'sb-accept' : 'sb-reject'
  b.textContent = type === 'accept' ? 'Accept' : 'Reject'
  b.onmousedown = action
  return b
}

// Selectors carry `.cm-merge-b` / `.cm-deletedChunk` to outrank the add-on's base theme.
const theme = EditorView.theme({
  '&.cm-merge-b .cm-changedLine, .cm-insertedLine': { background: 'var(--ed-add)' },
  '&.cm-merge-b .cm-deletedChunk': { background: 'var(--ed-del)', position: 'relative', paddingRight: '150px' },
  '.cm-deletedChunk .cm-deletedLine, .cm-deletedChunk .cm-deletedLine del': { textDecoration: 'line-through' },
  '.cm-deletedChunk .cm-chunkButtons': { display: 'flex', gap: '6px' },
  '.cm-deletedChunk .cm-chunkButtons button': {
    background: 'none', border: '1.5px solid var(--flag)', borderRadius: '9px', color: 'var(--ed-text)',
    font: '800 11px var(--font)', padding: '2px 9px', margin: '0',
  },
  '.cm-deletedChunk .cm-chunkButtons .sb-reject': { borderColor: 'var(--ed-line-no)' },
  '.sb-accept::before': { content: '"✓ "', color: 'var(--flag)' },
  '.sb-reject::before': { content: '"✕ "' },
})

export default function MergeReview({ path, code, proposed, onDecide }: Props) {
  const host = useRef<HTMLDivElement>(null)

  // Reads its props once: the parent keys it by Review and file.
  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: proposed,
        extensions: [
          setup(path),
          EditorView.lineWrapping,
          EditorState.readOnly.of(true),
          unifiedMergeView({ original: code, gutter: false, highlightChanges: false, mergeControls }),
          theme,
          EditorView.updateListener.of(u => {
            const original = getOriginalDoc(u.state)
            if (u.docChanged || original !== getOriginalDoc(u.startState)) {
              onDecide(original.toString(), getChunks(u.state)?.chunks.length ?? 0, u.state.doc.toString())
            }
          }),
        ],
      }),
    })
    const first = getChunks(view.state)?.chunks[0]
    if (first) view.dispatch({ effects: EditorView.scrollIntoView(first.fromB, { y: 'center' }) })
    return () => view.destroy()
  }, [])

  return <div ref={host} className={styles.host} />
}
