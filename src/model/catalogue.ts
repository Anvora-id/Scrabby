import type { IconKey } from '../icons.ts'
import type { BlockType, TraitType } from './types.ts'

export type Category = 'site' | 'pages' | 'ui' | 'prim' | 'design' | 'behavior' | 'content' | 'bob' | 'my'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'pages', label: 'Pages' },
  { id: 'ui', label: 'UI' },
  { id: 'prim', label: 'Primitives' },
  { id: 'design', label: 'Design' },
  { id: 'behavior', label: 'Behavior' },
  { id: 'content', label: 'Content' },
  { id: 'bob', label: 'Talk to Bob' },
  { id: 'my', label: 'My Blocks' },
]

export interface BlockTypeDef {
  label: string
  category: Category
  icon: IconKey
  meaning: string
  accepts: BlockType[]
  tooltip: string
}

const ANY_PART: BlockType[] = ['navbar', 'hero', 'section', 'cardgrid', 'card', 'form', 'popup', 'footer', 'text', 'image', 'button', 'box']

export const BLOCK_TYPES: Record<BlockType, BlockTypeDef> = {
  canvas: { label: 'Canvas', category: 'site', icon: 'site', meaning: '', accepts: ['site', 'checkpoint', 'navbar', 'hero', 'section', 'cardgrid', 'card', 'form', 'popup', 'footer', 'text', 'image', 'button', 'box', 'page'], tooltip: '' },
  site: { label: 'Site', category: 'site', icon: 'site', meaning: 'The whole website; its Traits describe every page.', accepts: ['page'], tooltip: 'Your whole website. Traits here apply to every page.' },
  page: { label: 'Page', category: 'pages', icon: 'page', meaning: 'One page of the website, in its own `.html` file.', accepts: ANY_PART, tooltip: 'One page of your website. Put it inside {where}.' },
  checkpoint: { label: 'Checkpoint', category: 'site', icon: 'checkpoint', meaning: 'The website as already built; its Traits ask for changes across the whole site, and new Pages in it are new pages.', accepts: ['page'], tooltip: 'Your website as Bob built it. Drop in Pages or Traits to ask for changes.' },
  navbar: { label: 'Navbar', category: 'ui', icon: 'navbar', meaning: 'The bar of links for getting around the site.', accepts: ANY_PART, tooltip: 'The menu bar with links, usually at the top of every page.' },
  hero: { label: 'Hero', category: 'ui', icon: 'hero', meaning: 'The big eye-catching banner at the top of a page, usually with a headline, an image and a button.', accepts: ANY_PART, tooltip: 'The big first thing people see on a page: a headline, a picture, a button.' },
  section: { label: 'Section', category: 'ui', icon: 'section', meaning: 'One band of a page that groups content with one purpose.', accepts: ANY_PART, tooltip: 'A part of a page that groups things together.' },
  cardgrid: { label: 'Card grid', category: 'ui', icon: 'cardgrid', meaning: 'A grid of similar Cards. Repeat the Cards to a full grid with varied content only if a "fake data" Trait asks for it; otherwise show the Cards placed.', accepts: ANY_PART, tooltip: 'A grid of cards, like products or photos.' },
  card: { label: 'Card', category: 'ui', icon: 'card', meaning: 'A small box that shows one thing, usually an image, a title and a short text.', accepts: ANY_PART, tooltip: 'One box with a picture, some words and maybe a button.' },
  form: { label: 'Form', category: 'ui', icon: 'form', meaning: 'Fields a visitor fills in and sends; sending is fake and shows a success message.', accepts: ANY_PART, tooltip: 'Boxes people type into, with a Send button. Sending is pretend.' },
  popup: { label: 'Popup', category: 'ui', icon: 'popup', meaning: 'A box that opens over the page and has a way to close it. It stays closed unless an "on click" opens it, a Note or "tell Bob" says when it opens, or a "let Bob pick" covers it.', accepts: ANY_PART, tooltip: 'A small window that pops up over the page.' },
  footer: { label: 'Footer', category: 'ui', icon: 'footer', meaning: 'The strip at the bottom with small print, contact details and links.', accepts: ANY_PART, tooltip: 'The strip at the very bottom of a page.' },
  text: { label: 'Textbox', category: 'prim', icon: 'text', meaning: 'Words: a heading, paragraph or label, whichever fits.', accepts: [], tooltip: 'Words on the page.' },
  image: { label: 'Frame', category: 'prim', icon: 'image', meaning: 'One picture. With no image Trait, a plain placeholder box labelled with the Block\'s name; a Library Asset only under "let Bob pick".', accepts: [], tooltip: 'A picture from your Library.' },
  button: { label: 'Button', category: 'prim', icon: 'button', meaning: 'Something a visitor clicks.', accepts: [], tooltip: 'Something people click.' },
  box: { label: 'Panel', category: 'prim', icon: 'box', meaning: 'Groups what\'s inside; has no meaning of its own.', accepts: ANY_PART, tooltip: 'An empty panel that holds other Blocks.' },
}

export const BUILT_PAGE = {
  label: 'Built page',
  meaning: 'A page already built; Blocks and Traits in it ask for changes or additions to that page.',
  tooltip: 'A page Bob already built. Drop Blocks or Traits here to change it.',
}

export const LOOSE_IDEA_TOOLTIP = 'Loose idea: Bob ignores it until you move it into {where}.'

export type ValueKind = 'text' | 'choice' | 'color' | 'asset' | 'action'

export interface TraitTypeDef {
  label: string
  category: Category
  icon: IconKey
  valueKind: ValueKind
  choices?: string[]
  default: string
  meaning: string
  tooltip: string
  hint?: string
  stretch?: true
}

export const PLAYS_A_SOUND = 'plays a sound'

export const ON_CLICK_CHOICES = [
  'submits (fake)',
  'adds to cart (fake)',
  PLAYS_A_SOUND,
  "shows / hides what's inside",
  'adds to a list',
  'checks an answer',
  'counts clicks',
  'remembers on this device',
]

export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'coral', hex: '#FF8A80' },
  { name: 'pink', hex: '#F8BBD0' },
  { name: 'orange', hex: '#FFB74D' },
  { name: 'sunny yellow', hex: '#FFE066' },
  { name: 'lime', hex: '#C5E1A5' },
  { name: 'mint', hex: '#A8E6CF' },
  { name: 'sky blue', hex: '#81D4FA' },
  { name: 'navy', hex: '#1E3A5F' },
  { name: 'lavender', hex: '#C5B3F6' },
  { name: 'brown', hex: '#8D6E63' },
  { name: 'black', hex: '#111111' },
  { name: 'white', hex: '#FFFFFF' },
]

export const TRAIT_TYPES: Record<TraitType, TraitTypeDef> = {
  color: { label: 'color', category: 'design', icon: 't_color', valueKind: 'color', default: '#3B82F6', meaning: 'main color of this Block; decide where it shows, keep text readable', tooltip: 'The main color of this Block.' },
  font: { label: 'font', category: 'design', icon: 't_font', valueKind: 'choice', choices: ['Nunito', 'Poppins', 'Merriweather', 'Playfair Display', 'Caveat', 'Space Mono', 'Bebas Neue', 'Pacifico'], default: 'Nunito', meaning: 'typeface for this Block\'s text', tooltip: 'The style of the letters.' },
  vibe: { label: 'vibe', category: 'design', icon: 't_vibe', valueKind: 'choice', choices: ['playful', 'calm', 'bold', 'minimal', 'elegant', 'retro'], default: 'playful', meaning: 'overall feel: wording, shapes, spacing, motion', tooltip: 'The overall feeling, like playful or calm.' },
  size: { label: 'size', category: 'design', icon: 't_size', valueKind: 'choice', choices: ['small', 'medium', 'large', 'full width', 'full screen'], default: 'medium', meaning: 'room it takes in its parent; "full screen" fills the window', tooltip: 'How big this Block is.' },
  position: { label: 'position', category: 'design', icon: 't_position', valueKind: 'choice', choices: ['top', 'bottom', 'left', 'right', 'center', 'stays on top when scrolling', 'floating corner'], default: 'top', meaning: 'where it sits inside its parent', tooltip: 'Where this Block sits.' },
  onclick: { label: 'on click', category: 'behavior', icon: 't_onclick', valueKind: 'action', default: '', meaning: 'when a visitor clicks this Block', tooltip: 'What happens when someone clicks it, like opening a page or a popup.' },
  purpose: { label: 'purpose', category: 'behavior', icon: 't_purpose', valueKind: 'choice', choices: ['slideshow', 'countdown', 'search (fake)', 'filter / sort (fake)', 'appears on scroll'], default: 'slideshow', meaning: 'what this Block does by itself, no click needed', tooltip: 'What this Block does by itself, like a slideshow.' },
  fakedata: { label: 'fake data', category: 'behavior', icon: 't_fakedata', valueKind: 'text', default: '6 items with prices', meaning: 'fill with made-up content as described', tooltip: 'Pretend content that Bob makes up, like 6 products with prices.' },
  text: { label: 'text', category: 'content', icon: 't_text', valueKind: 'text', default: 'Hello!', meaning: 'exact words to show, as written', tooltip: 'The words this Block shows.' },
  image: { label: 'image', category: 'content', icon: 't_image', valueKind: 'asset', default: '', meaning: 'show this picture', tooltip: 'The picture this Block shows, from your Library.' },
  sound: { label: 'sound', category: 'content', icon: 't_sound', valueKind: 'asset', default: '', meaning: 'play this sound when the Block is clicked, unless "purpose" says otherwise', tooltip: 'The sound this Block plays, from your Library.', stretch: true },
  video: { label: 'video', category: 'content', icon: 't_video', valueKind: 'asset', default: '', meaning: 'show this video with play controls', tooltip: 'The video this Block shows, from your Library.' },
  tellbob: { label: 'tell Bob', category: 'bob', icon: 't_tellbob', valueKind: 'text', default: '', meaning: 'what the user tells Bob', tooltip: 'Tell Bob anything the other Blocks can\'t say.', hint: 'like make it feel cozy' },
  letbobpick: { label: 'let Bob pick', category: 'bob', icon: 't_bobpicks', valueKind: 'text', default: '', meaning: 'what Bob decides; empty means anything in this Block', tooltip: 'Let Bob decide something for you, like the colors.', hint: 'like the colors' },
}

export function acceptsBlock(parent: BlockType, child: BlockType): boolean {
  return parent === 'canvas' || BLOCK_TYPES[parent].accepts.includes(child)
}
