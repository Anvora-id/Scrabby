import type { Extension } from '@codemirror/state'
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab, redo } from '@codemirror/commands'
import { HighlightStyle, bracketMatching, syntaxHighlighting } from '@codemirror/language'
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search'
import { tags } from '@lezer/highlight'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'

const highlight = HighlightStyle.define([
  { tag: tags.tagName, color: 'var(--ed-tag)' },
  { tag: tags.attributeName, color: 'var(--ed-attr)' },
  { tag: [tags.string, tags.attributeValue], color: 'var(--ed-string)' },
  { tag: tags.comment, color: 'var(--ed-comment)', fontStyle: 'italic' },
  { tag: tags.propertyName, color: '#7CC4FF' },
  { tag: tags.keyword, color: '#FF9EC7' },
  { tag: [tags.number, tags.bool], color: '#FFB86B' },
  { tag: [tags.typeName, tags.className], color: '#8BE9C4' },
  { tag: [tags.punctuation, tags.angleBracket], color: 'var(--ed-line-no)' },
])

const match = { background: '#F5C73D33', outline: '1px solid #F5C73D80' }

const theme = EditorView.theme({
  '&': { height: '100%', background: 'var(--ed-bg)', color: 'var(--ed-text)', fontSize: '12.5px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.75' },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--ed-text)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--ed-text)' },
  '.cm-gutters': { background: 'var(--ed-bg)', color: 'var(--ed-line-no)', border: 'none', userSelect: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 12px 0 0', textAlign: 'right' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { background: 'var(--ed-rule)' },
  '.cm-activeLine, .cm-activeLineGutter': { background: '#FFFFFF08' },
  '.cm-searchMatch, .cm-selectionMatch': match,
  '.cm-searchMatch.cm-searchMatch-selected': { background: '#F5C73D66' },
  '.cm-panels': { background: 'var(--ed-tabs)', color: 'var(--ed-text)' },
  '.cm-panels .cm-textfield': { background: 'var(--ed-bg)', border: '1px solid var(--ed-rule)', color: 'var(--ed-text)' },
  '.cm-panels .cm-button, .cm-panels button[name=close]': {
    background: 'none', backgroundImage: 'none', border: 'none', color: 'var(--ed-tab-text)', font: '700 12.5px var(--font)',
  },
}, { dark: true })

const languages: Record<string, () => Extension> = { html, css, js: javascript }

export function setup(path: string): Extension {
  const lang = languages[path.slice(path.lastIndexOf('.') + 1)]
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    search({ top: true }),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      // Explicit, so Ctrl+Y and Ctrl+Shift+Z redo on every platform.
      { key: 'Mod-y', run: redo, preventDefault: true },
      { key: 'Mod-Shift-z', run: redo, preventDefault: true },
      ...historyKeymap,
      indentWithTab,
    ]),
    syntaxHighlighting(highlight),
    lang ? lang() : [],
    theme,
  ]
}
