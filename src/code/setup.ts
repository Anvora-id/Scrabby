import type { Extension } from '@codemirror/state'
import { EditorView, drawSelection, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'

const highlight = HighlightStyle.define([
  { tag: tags.tagName, color: 'var(--ed-tag)' },
  { tag: tags.attributeName, color: 'var(--ed-attr)' },
  { tag: [tags.string, tags.attributeValue], color: 'var(--ed-string)' },
  { tag: tags.comment, color: 'var(--ed-comment)', fontStyle: 'italic' },
])

const theme = EditorView.theme({
  '&': { height: '100%', background: 'var(--ed-bg)', color: 'var(--ed-text)', fontSize: '12.5px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.75' },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--ed-text)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--ed-text)' },
  '.cm-gutters': { background: 'var(--ed-bg)', color: 'var(--ed-line-no)', border: 'none', userSelect: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 12px 0 0', textAlign: 'right' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { background: 'var(--ed-rule)' },
}, { dark: true })

const languages: Record<string, () => Extension> = { html, css, js: javascript }

export function setup(path: string): Extension {
  const lang = languages[path.slice(path.lastIndexOf('.') + 1)]
  return [
    lineNumbers(),
    history(),
    drawSelection(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    syntaxHighlighting(highlight),
    lang ? lang() : [],
    theme,
  ]
}
