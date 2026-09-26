import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { acceptAll, ask, askAgain, cardState, openFiles, rejectAll, setLevel, useLevel, useReply, type Level } from '../assistant.ts'
import { withNames } from '../checkpoints.ts'
import { startReview } from '../code/navigation.ts'
import { ICONS } from '../icons.ts'
import type { ChatMessage, Files, Proposal } from '../model/types.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { useProject } from '../store.ts'
import styles from './Assistant.module.css'

const LEVELS: Level[] = ['very simply', 'simply', 'in detail']

export default function Assistant() {
  const project = useProject()
  const level = useLevel()
  const run = useReply()
  const replying = run !== null
  // A reply for a replaced Project (New Project, the demo) shows nothing here.
  const live = run && run.project === project.id ? run : null
  // Sent, but the server hasn't accepted it yet: the question and Bob thinking show in the panel only.
  const waiting = live && live.bob === undefined ? live.asked : null
  const [draft, setDraft] = useState('')
  const [limit, setLimit] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  // Keyed by position, so when the server accepts, the real messages take the waiting pair's places without popping again.
  // (A replaced chat reuses elements and skips its pop, unseen: New Project and the demo switch to Plan.)
  const chat: ChatMessage[] = waiting === null ? project.chat : [...project.chat, { role: 'user', text: waiting, time: -2 }, { role: 'bob', text: '', time: -1 }]
  const liveBob = live ? live.bob ?? -1 : undefined

  useLayoutEffect(() => {
    const el = chatRef.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [chat])

  useEffect(() => {
    if (!limit) return
    const close = () => setLimit(null)
    document.addEventListener('click', close, { once: true })
    return () => document.removeEventListener('click', close)
  }, [limit])

  function onScroll() {
    const el = chatRef.current
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 8
  }

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || replying) return
    setDraft('')
    pinned.current = true
    ask(text)
      .then(message => {
        if (!message) return
        setDraft(text)
        setLimit(message)
      })
      .catch(err => console.error('The Assistant failed', err))
  }

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <img className={styles.head} src="/bob-head.svg" alt="" />
        <span className={styles.name}>Bob</span>
        <BobBadge />
      </div>
      <div className={styles.picker}>
        Explain:
        <div className={styles.segments} role="radiogroup" aria-label="Explain">
          {LEVELS.map(l => (
            <button key={l} type="button" role="radio" aria-checked={level === l} className={styles.segment} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.chat} ref={chatRef} onScroll={onScroll}>
        {chat.length === 0 && (
          <div className={styles.empty}>
            <img className={styles.emptyHead} src="/bob-head.svg" alt="" />
            Ask Bob what a part of your code does, or ask for a change.
          </div>
        )}
        {chat.map((m, i) =>
          m.line ? (
            <p key={i} className={styles.line}>{withNames(project, m.text)}</p>
          ) : m.role === 'user' ? (
            <div key={i} className={styles.user}>{m.text}</div>
          ) : (
            <BobSays key={i}>
              {m.time === liveBob && !m.proposal ? (m.text ? <>{m.text}<Dots /></> : <Thinking />) : m.text}
              {m.proposal && <DiffCard time={m.time} proposal={m.proposal} files={project.files} replying={replying} />}
            </BobSays>
          ),
        )}
      </div>
      <form className={styles.composer} onSubmit={send}>
        <input
          className={styles.input}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Ask about your code, or ask for a change"
          aria-label="Message to Bob"
        />
        <span className={styles.sendWrap}>
          {limit && (
            <span className={styles.bubble} role="status">
              {limit}
              <span className={styles.tail} />
            </span>
          )}
          <button type="submit" className={`${styles.ghost} ${limit ? styles.target : ''}`} disabled={replying || !draft.trim()}>
            Send
          </button>
        </span>
      </form>
    </div>
  )
}

function BobSays({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bobRow}>
      <img className={styles.avatar} src="/bob-head.svg" alt="" />
      <div className={styles.bob}>{children}</div>
    </div>
  )
}

function Dots() {
  return <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
}

function Thinking() {
  return (
    <span className={styles.thinking} role="status">
      <Dots />
      Bob is thinking…
    </span>
  )
}

// A proposal can have no file left to review (every file already matches).
function review(time: number, pr: Proposal): void {
  const first = openFiles(pr)[0]
  if (first) startReview(time, first)
}

function DiffCard({ time, proposal, files, replying }: { time: number; proposal: Proposal; files: Files; replying: boolean }) {
  const state = cardState(proposal, files)
  const count = `${proposal.accepted} of ${proposal.total} changes accepted`
  return (
    <div className={styles.card}>
      {state === 'outOfDate' && <span className={styles.tag}>Out of date</span>}
      <div className={styles.summary}>{proposal.summary}</div>
      <div className={styles.files}>{Object.keys(proposal.files).join(', ')}</div>
      <div className={styles.buttons}>
        {state === 'open' && (
          <>
            <button type="button" className={styles.accept} onClick={() => acceptAll(time)}>
              <ICONS.check weight="fill" size={14} className={styles.tick} />
              Accept all
            </button>
            <button type="button" className={styles.ghost} onClick={() => rejectAll(time)}>Reject all</button>
            <button type="button" className={styles.ghost} onClick={() => review(time, proposal)}>Review</button>
          </>
        )}
        {state === 'reviewing' && (
          <>
            <span className={styles.status}>{count}</span>
            <button type="button" className={styles.ghost} onClick={() => review(time, proposal)}>Review</button>
          </>
        )}
        {state === 'partial' && <span className={styles.status}>{count}</span>}
        {state === 'accepted' && (
          <span className={styles.status}>
            <ICONS.check weight="fill" size={16} className={styles.tick} />
            Accepted, in your code now
          </span>
        )}
        {state === 'rejected' && <span className={styles.rejected}>Rejected</span>}
        {state === 'outOfDate' && (
          <>
            <button
              type="button"
              className={styles.ghost}
              disabled={replying}
              onClick={() => askAgain(time).catch(err => console.error('The Assistant failed', err))}
            >
              Ask again
            </button>
            <button type="button" className={styles.text} onClick={() => rejectAll(time)}>Dismiss</button>
          </>
        )}
      </div>
    </div>
  )
}
