import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { acceptAll, ask, askAgain, cardState, openFiles, rejectAll, setLevel, useLevel, useReplying, type Level } from '../assistant.ts'
import { startReview } from '../code/navigation.ts'
import { ICONS } from '../icons.ts'
import type { Files, Proposal } from '../model/types.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { useProject } from '../store.ts'
import styles from './Assistant.module.css'

const LEVELS: Level[] = ['very simply', 'simply', 'in detail']

export default function Assistant() {
  const project = useProject()
  const level = useLevel()
  const replying = useReplying()
  const [draft, setDraft] = useState('')
  const [limit, setLimit] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  const chat = project.chat
  const lastBob = chat.filter(m => m.role === 'bob' && !m.line).at(-1)

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
        {chat.map(m =>
          m.line ? (
            <p key={m.time} className={styles.line}>{m.text}</p>
          ) : (
            <div key={m.time} className={m.role === 'user' ? styles.user : styles.bob}>
              {m === lastBob && !m.text && replying ? (
                <span className={styles.dots} role="status" aria-label="Bob is thinking…"><i /><i /><i /></span>
              ) : (
                m.text
              )}
              {m.proposal && <DiffCard time={m.time} proposal={m.proposal} files={project.files} replying={replying} />}
            </div>
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
            <button type="button" className={styles.ghost} onClick={() => startReview(time, openFiles(proposal)[0])}>Review</button>
          </>
        )}
        {state === 'reviewing' && (
          <>
            <span className={styles.status}>{count}</span>
            <button type="button" className={styles.ghost} onClick={() => startReview(time, openFiles(proposal)[0])}>Review</button>
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
