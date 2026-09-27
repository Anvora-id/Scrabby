import { useEffect, useMemo, useRef, useState } from 'react'
import { Compartment, EditorState, RangeSet, StateEffect, StateField, Transaction, type Extension, type Range } from '@codemirror/state'
import { Decoration, EditorView, GutterMarker, gutter, type DecorationSet } from '@codemirror/view'
import { redo, redoDepth, undo, undoDepth } from '@codemirror/commands'
import { getProject, updateProject, useProject } from '../store.ts'
import { listCheckpoints } from '../db.ts'
import { cardState, decide, openFiles } from '../assistant.ts'
import type { Checkpoint, Files } from '../model/types.ts'
import { blockInfo, blockMarks, changedLines, newFileProblem, tabOrder } from '../code/code.ts'
import { setup } from '../code/setup.ts'
import { clearJump, editorSelection, openCheckpointsAtBlock, openFile, useEditorUi } from '../code/navigation.ts'
import MergeReview from '../code/MergeReview.tsx'
import styles from '../code/editor.module.css'

const decorations = new Compartment()
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

class Bar extends GutterMarker {
  toDOM() {
    const d = document.createElement('div')
    d.className = styles.bar
    return d
  }
}
const bar = new Bar()

class BlockDot extends GutterMarker {
  id: string; name: string; category: string
  constructor(id: string, name: string, category: string) {
    super()
    this.id = id; this.name = name; this.category = category
  }
  eq(o: BlockDot) { return o.id === this.id && o.name === this.name && o.category === this.category }
  toDOM() {
    const b = document.createElement('button')
    b.className = `${styles.blockDot} cat-${this.category}`
    b.title = `${this.name} Block · Show in Checkpoints`
    b.onclick = () => openCheckpointsAtBlock(this.id)
    return b
  }
}

// Change bars and Block dots share one narrow gutter left of the line numbers.
function lineMarks(file: string, base: Files | undefined, checkpoints: Checkpoint[]): Extension {
  const compute = (state: EditorState) => {
    const text = state.doc.toString()
    const ranges: Range<GutterMarker>[] = []
    // A file the base does not have gets only its tab dot.
    if (base?.[file] !== undefined) for (const n of changedLines(base[file], text)) ranges.push(bar.range(state.doc.line(n).from))
    for (const { line, id } of blockMarks(text)) {
      const info = blockInfo(id, getProject(), checkpoints)
      if (info) ranges.push(new BlockDot(id, info.name, info.category).range(state.doc.line(line).from))
    }
    return RangeSet.of(ranges, true)
  }
  const marks = StateField.define<RangeSet<GutterMarker>>({
    create: compute,
    update: (v, tr) => tr.docChanged ? compute(tr.state) : v,
  })
  return [marks, gutter({ class: styles.marks, markers: v => v.state.field(marks) })]
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
  track: (v: EditorView | null) => void
}

function FileEditor({ file, text, base, checkpoints, jump, states, stateKey, track }: FileEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Keyed by file: one view per open tab; its state (undo, cursor) waits in `states` while another tab is open.
  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: states.get(stateKey) ?? EditorState.create({
        doc: text,
        extensions: [
          decorations.of([]), // first, so its gutter sits left of the line numbers
          setup(file),
          flashField,
          keepUndoInside,
          EditorView.updateListener.of(u => {
            if (!u.docChanged) return
            const doc = u.state.doc.toString()
            if (getProject().files[file] !== doc) updateProject(p => { p.files[file] = doc })
          }),
        ],
      }),
      // Per view, not per state: a saved state must not keep an old tab's callback.
      dispatchTransactions(trs, v) {
        v.update(trs)
        track(v)
      },
    })
    view.current = v
    track(v)
    editorSelection.read = () => {
      const s = v.state.selection.main
      return v.state.sliceDoc(s.from, s.to)
    }
    return () => {
      clearTimeout(flashTimer.current)
      v.dispatch({ effects: setFlash.of(null) })
      states.set(stateKey, v.state)
      editorSelection.read = () => null
      track(null)
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
    view.current!.dispatch({ effects: decorations.reconfigure(lineMarks(file, base, checkpoints)) })
  }, [base, checkpoints])

  useEffect(() => {
    if (!jump || jump.file !== file) return
    // Cleared at once so a later remount does not jump again; the timer lives in a ref so this does not cancel it.
    clearJump()
    const v = view.current!
    const line = v.state.doc.line(Math.min(jump.line, v.state.doc.lines))
    v.dispatch({ selection: { anchor: line.from }, effects: [EditorView.scrollIntoView(line.from, { y: 'center' }), setFlash.of(line.from)] })
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => v.dispatch({ effects: setFlash.of(null) }), 1500)
  }, [jump])

  return <div ref={host} className={styles.host} />
}

export default function CodeEditor() {
  const project = useProject()
  const ui = useEditorUi()
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const states = useRef(new Map<string, EditorState>()).current
  const view = useRef<EditorView | null>(null)
  const [undoable, setUndoable] = useState(0)
  const [redoable, setRedoable] = useState(0)
  const [newName, setNewName] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    listCheckpoints(project.id).then(c => { if (live) setCheckpoints(c) }, e => console.error('Reading Checkpoints failed', e))
    return () => { live = false }
  }, [project.id, project.checkpoint])

  // Change bars show what changed since the Checkpoint the Project is on: after a Build, what Bob wrote.
  const base = useMemo(() => checkpoints.find(c => c.number === project.checkpoint)?.files, [checkpoints, project.checkpoint])

  const track = (v: EditorView | null) => {
    view.current = v
    setUndoable(v ? undoDepth(v.state) : 0)
    setRedoable(v ? redoDepth(v.state) : 0)
  }

  const history = (command: typeof undo) => {
    const v = view.current
    if (!v) return
    command(v)
    v.focus()
  }

  const cancelNew = () => { setNewName(null); setProblem(null) }

  const createNew = () => {
    const name = (newName ?? '').trim().toLowerCase()
    const p = newFileProblem(name, project.files)
    if (p) return setProblem(p)
    updateProject(d => { d.files[name] = '' })
    openFile(name)
    cancelNew()
  }

  const review = ui.review
  const proposal = review === undefined ? undefined : project.chat.find(m => m.time === review)?.proposal
  const state = proposal && cardState(proposal, project.files)
  const reviewFiles = proposal && (state === 'open' || state === 'reviewing') ? openFiles(proposal) : []
  const tabs = tabOrder([
    ...Object.keys(project.files).filter(f => !f.startsWith('.builds/')),
    ...reviewFiles.filter(f => !(f in project.files)),
  ])
  const file = ui.file !== undefined && tabs.includes(ui.file) ? ui.file : tabs[0]

  if (file === undefined) {
    return <div className={styles.codeEditor}><p className={styles.empty}>No code yet. Build your website first.</p></div>
  }

  return (
    <div className={styles.codeEditor}>
      <div className={styles.strip}>
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
        {newName === null
          ? <button type="button" className={styles.tool} title="New file" onClick={() => setNewName('')}>+</button>
          : <input
              className={styles.newName}
              autoFocus
              placeholder="name.html, .css or .js"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createNew()
                else if (e.key === 'Escape') cancelNew()
              }}
              onBlur={cancelNew}
            />}
        <span className={styles.spacer} />
        <button type="button" className={styles.tool} title="Undo (Ctrl+Z)" disabled={undoable === 0} onClick={() => history(undo)}>↶</button>
        <button type="button" className={styles.tool} title="Redo (Ctrl+Y)" disabled={redoable === 0} onClick={() => history(redo)}>↷</button>
      </div>
      {problem && <p className={styles.problem}>{problem}</p>}
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
              track={track}
            />}
      </div>
    </div>
  )
}
