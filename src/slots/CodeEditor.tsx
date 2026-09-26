import { useEffect, useMemo, useRef, useState } from 'react'
import { Compartment, EditorState, StateEffect, StateField, Transaction, type Extension, type Range } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view'
import { getProject, updateProject, useProject } from '../store.ts'
import { listCheckpoints } from '../db.ts'
import { cardState, decide, openFiles } from '../assistant.ts'
import type { Checkpoint, Files } from '../model/types.ts'
import { blockInfo, blockMarks, changedLines } from '../code/code.ts'
import { setup } from '../code/setup.ts'
import { clearJump, editorSelection, openCheckpointsAtBlock, openFile, useEditorUi } from '../code/navigation.ts'
import MergeReview from '../code/MergeReview.tsx'
import styles from '../code/editor.module.css'

const decorations = new Compartment()
const changedLine = Decoration.line({ class: styles.changed })
const flashLine = Decoration.line({ class: styles.flash })

const setFlash = StateEffect.define<number | null>()
const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) if (e.is(setFlash)) deco = e.value === null ? Decoration.none : Decoration.set(flashLine.range(e.value))
    return deco
  },
  provide: f => EditorView.decorations.from(f),
})

class Chip extends WidgetType {
  id: string; name: string; category: string
  constructor(id: string, name: string, category: string) {
    super()
    this.id = id; this.name = name; this.category = category
  }
  eq(o: Chip) { return o.id === this.id && o.name === this.name && o.category === this.category }
  toDOM() {
    const b = document.createElement('button')
    b.className = `${styles.chip} cat-${this.category}`
    b.textContent = `◧ ${this.name} Block`
    b.title = 'Show this Block in Checkpoints'
    b.onclick = () => openCheckpointsAtBlock(this.id)
    return b
  }
}

function lineDecorations(file: string, base: Files | undefined, checkpoints: Checkpoint[]): Extension {
  return EditorView.decorations.compute(['doc'], state => {
    const text = state.doc.toString()
    const ranges: Range<Decoration>[] = []
    if (base) for (const n of changedLines(base[file], text)) ranges.push(changedLine.range(state.doc.line(n).from))
    for (const { line, id } of blockMarks(text)) {
      const info = blockInfo(id, getProject(), checkpoints)
      if (info) ranges.push(Decoration.widget({ widget: new Chip(id, info.name, info.category), side: 1 }).range(state.doc.line(line).to))
    }
    return Decoration.set(ranges, true)
  })
}

// Ctrl+Z / Ctrl+Y belong to the editor's own history here, not the app's Undo in the menu bar.
const keepUndoInside = EditorView.domEventHandlers({
  keydown(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) e.stopPropagation()
    return false
  },
})

interface FileEditorProps {
  file: string
  text: string
  base: Files | undefined
  checkpoints: Checkpoint[]
  jump: { file: string; line: number } | undefined
  states: Map<string, EditorState>
  stateKey: string
}

function FileEditor({ file, text, base, checkpoints, jump, states, stateKey }: FileEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView>(null)

  // Keyed by file: one view per open tab; its state (undo, cursor) waits in `states` while another tab is open.
  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: states.get(stateKey) ?? EditorState.create({
        doc: text,
        extensions: [
          setup(file),
          decorations.of([]),
          flashField,
          keepUndoInside,
          EditorView.updateListener.of(u => {
            if (!u.docChanged) return
            const doc = u.state.doc.toString()
            if (getProject().files[file] !== doc) updateProject(p => { p.files[file] = doc })
          }),
        ],
      }),
    })
    view.current = v
    editorSelection.read = () => {
      const s = v.state.selection.main
      return v.state.sliceDoc(s.from, s.to)
    }
    return () => {
      states.set(stateKey, v.state)
      editorSelection.read = () => null
      v.destroy()
    }
  }, [])

  useEffect(() => {
    const v = view.current!
    if (v.state.doc.toString() !== text) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text }, annotations: Transaction.addToHistory.of(false) })
    }
  }, [text])

  useEffect(() => {
    view.current!.dispatch({ effects: decorations.reconfigure(lineDecorations(file, base, checkpoints)) })
  }, [base, checkpoints])

  useEffect(() => {
    if (!jump || jump.file !== file) return
    const v = view.current!
    const line = v.state.doc.line(Math.min(jump.line, v.state.doc.lines))
    v.dispatch({ selection: { anchor: line.from }, effects: [EditorView.scrollIntoView(line.from, { y: 'center' }), setFlash.of(line.from)] })
    const t = setTimeout(() => {
      v.dispatch({ effects: setFlash.of(null) })
      clearJump()
    }, 1500)
    return () => clearTimeout(t)
  }, [jump])

  return <div ref={host} className={styles.host} />
}

export default function CodeEditor() {
  const project = useProject()
  const ui = useEditorUi()
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const states = useRef(new Map<string, EditorState>()).current

  useEffect(() => {
    let live = true
    listCheckpoints(project.id).then(c => { if (live) setCheckpoints(c) }, e => console.error('Reading Checkpoints failed', e))
    return () => { live = false }
  }, [project.id])

  const base = useMemo(() => {
    let newest: Checkpoint | undefined
    for (const c of checkpoints) if (c.blocks && (!newest || c.number > newest.number)) newest = c
    return newest?.before
  }, [checkpoints])

  const review = ui.review
  const proposal = review === undefined ? undefined : project.chat.find(m => m.time === review)?.proposal
  const state = proposal && cardState(proposal, project.files)
  const reviewFiles = proposal && (state === 'open' || state === 'reviewing') ? openFiles(proposal) : []
  const tabs = [
    ...Object.keys(project.files).filter(f => !f.startsWith('.builds/')),
    ...reviewFiles.filter(f => !(f in project.files)),
  ]
  const file = ui.file !== undefined && tabs.includes(ui.file) ? ui.file : tabs[0]

  if (file === undefined) {
    return <div className={styles.codeEditor}><p className={styles.empty}>No code yet. Build your website first.</p></div>
  }

  return (
    <div className={styles.codeEditor}>
      <div className={styles.tabs} role="tablist">
        {tabs.map(f => (
          <button key={f} role="tab" aria-selected={f === file} className={styles.tab} onClick={() => openFile(f)}>
            {f}
            {reviewFiles.includes(f)
              ? <span className={styles.dot} title="Bob's suggested changes">●</span>
              : base && project.files[f] !== base[f] && <span className={styles.dot} title="changed by the last Build">●</span>}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        {proposal && review !== undefined && reviewFiles.includes(file)
          ? <MergeReview
              key={review + ':' + file}
              path={file}
              code={project.files[file] ?? ''}
              proposed={proposal.files[file].proposed}
              onDecide={(code, _, proposed) => decide(review, file, code, proposed)}
            />
          : <FileEditor
              key={project.id + ':' + file}
              file={file}
              text={project.files[file]}
              base={base}
              checkpoints={checkpoints}
              jump={ui.jump}
              states={states}
              stateKey={project.id + ':' + file}
            />}
      </div>
    </div>
  )
}
