export type BlockType = 'canvas' | 'site' | 'page' | 'checkpoint' | 'navbar' | 'hero' | 'section' | 'cardgrid'
  | 'card' | 'form' | 'popup' | 'footer' | 'text' | 'image' | 'button' | 'box'
export type TraitType = 'color' | 'font' | 'vibe' | 'size' | 'position' | 'onclick' | 'purpose' | 'fakedata'
  | 'text' | 'image' | 'sound' | 'video' | 'tellbob' | 'letbobpick'
export type Pos = { x: number; y: number }
export type Layout = { d: 'row' | 'col'; k: (string | Layout)[] } // rows and columns of child ids; for the user only

export interface Block {
  id: string            // b1, b2, …: permanent, never reused
  type: BlockType
  name: string
  note: string
  traits: string[]      // Trait ids, in order
  children: string[]    // Block ids, in order: the truth; `layout` is repaired to match it
  layout?: Layout
  pos?: Pos             // only on Blocks sitting directly on the Canvas
  file?: string         // Page Blocks: the .html file, set once at creation, never renamed
  locked?: boolean      // the Checkpoint Block and Built pages
  noteOn?: boolean      // Add Note shows an empty Note
  folded?: boolean      // unset: Blocks 4 levels deep start folded
  defines?: string      // this Block is the definition of Custom Block `defines`; lives off the Canvas
  inst?: string         // this Block is an Instance of Custom Block `inst`
  removed?: string[]    // on an Instance: definition parts removed from it
  from?: string         // a copied part: the definition part it follows
  ov?: { name?: true; note?: true } // fields this copied part changed
}

// Trait values are strings: color = hex; choice/text = the text (a value not in the choices is a "custom…" value);
// asset = an Asset id or ""; on click = a choice, "page:<blockId>" or "popup:<blockId>".
export interface Trait {
  id: string            // t1, t2, …
  type: TraitType
  value: string         // kept while bobPicks is on, so × restores it
  note: string          // also the Bob picks hint
  bobPicks?: boolean
  noteOn?: boolean
  pos?: Pos             // only on loose Traits sitting directly on the Canvas
  from?: string
  ov?: { value?: true; note?: true } // `value` covers bobPicks
}

export interface CustomBlockDef { id: string /* d1, d2, … */; blockId: string; color: { h: number; s: number; l: number } }
export type AssetKind = 'image' | 'video' | 'sound'
export interface Asset { id: string /* a1, … */; file: string /* path is assets/<file> */; kind: AssetKind; mime: string; bytes: number; width?: number; height?: number; seconds?: number }
export type Files = Record<string, string> // path → text

export interface ChatMessage {
  role: 'user' | 'bob'
  text: string
  time: number          // also the message's id; strictly increasing
  proposal?: Proposal   // the diff card
  line?: true           // an app line ("Code went back to Checkpoint 2"), never sent to Bob
}
export interface Proposal {
  summary: string
  files: Record<string, { base?: string; proposed: string }> // base missing = a new file
  total: number         // changes when proposed
  accepted: number
  decided: number
  done?: true
}
export interface Project {
  id: string            // crypto.randomUUID()
  name: string
  next: { b: number; t: number; d: number; a: number } // id counters
  blocks: Record<string, Block> // always holds the `canvas` Block (id 'canvas', type 'canvas')
  traits: Record<string, Trait>
  defs: Record<string, CustomBlockDef>
  assets: Asset[]
  files: Files          // the current Prototype code, including .builds/build-N.md
  chat: ChatMessage[]
  updated: number
  checkpoint?: number   // the Checkpoint last saved, restored or built from; unset before the first
  checkpointNames?: Record<number, string> // names the user gave Checkpoints, by number
}
export type CheckpointCanvas = Pick<Project, 'blocks' | 'traits' | 'defs' | 'assets'>
export interface Checkpoint {
  projectId: string
  number: number        // 1, 2, …; the list only grows
  saved?: string        // set when saved by hand: "Saved by you", "Saved before restoring Checkpoint 3"; unset on a Build's
  from?: number         // the Checkpoint the Project was on when this one was saved
  files: Files          // the code at that moment; a Build's Checkpoint is saved before Bob starts
  canvas: CheckpointCanvas // the Blocks, Traits, Custom Blocks and Library at that moment
  time: number
}
