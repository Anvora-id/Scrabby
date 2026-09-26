# Scrabby

A block-based prototyping IDE for websites and simple web apps, meant as the next step after Scratch for young developers. The hackathon build is for adults only. Users arrange loose ideas as nested Blocks and floating Traits on a Canvas, and Bob turns them into a clickable Prototype that they can then refine as code.

## Language

### Projects

**Project**:
One website or simple web app a user is planning, holding its Canvas, its Prototype code, its Library and its Assistant chat.
_Avoid_: App, workspace, file

**Prototype**:
The clickable website or simple web app (a quiz, a to-do list) that Bob generates from a Project's Blocks: page links, popups, fake form submits and fake data, with no real backend.
_Avoid_: Output, mockup, app

**Build**:
One run in which Bob adds or changes what the Blocks on the Canvas ask for, on top of the current Prototype code, keeping everything else, then saves a Checkpoint and clears those Blocks from the Canvas.
_Avoid_: Run, compile, generate

**Instruction document**:
The text the app writes from the Site Block or Checkpoint Block at the start of every Build; Bob reads it instead of the Canvas. Users never see it.
_Avoid_: Prompt, spec, brief

**Checkpoint**:
The Prototype code saved after a Build, with the Blocks that made it; the user can go back to it, or edit its Blocks and build that step again.
_Avoid_: Version, snapshot, save

**Assistant**:
The chat panel beside the code editor where the user talks with Bob about the Project's code; there Bob explains code and proposes edits as diffs the user accepts or rejects.
_Avoid_: Chatbot, copilot, helper; "the Assistant" for the agent itself (that is Bob)

**Bob**:
The agent inside Scrabby that runs Builds and answers in the Assistant; the product always calls it Bob and shows which model is running it (IBM Bob through its inference endpoint, or a fallback model named by the server).
_Avoid_: The AI, the model; "the IBM Bob IDE" means IBM's desktop IDE, where the team builds Scrabby

**Preview**:
The live, clickable view of the Prototype that the user tries out in Try & tweak.
_Avoid_: Stage, output, viewer

### Steps

**Step**:
One of the three screens a user moves through in order: Plan, Build step, Try & tweak. Only one is on screen at a time.
_Avoid_: Mode, stage, tab

**Plan**:
The Step where the user arranges Blocks and Traits on the Canvas and manages the Library.
_Avoid_: Design mode, edit mode

**Build step**:
The Step that shows a Build while it runs, and stays on screen if the Build fails. Say "Build step" for the screen and "Build" for the run.
_Avoid_: Build screen, progress page

**Try & tweak**:
The Step where the user clicks through the Preview, edits the Prototype code and asks the Assistant.
_Avoid_: Code mode, editor view, refine

### Canvas

**Canvas**:
The free-form surface where a Project's Blocks and Traits float; where things sit on it carries no meaning.
_Avoid_: Workspace, board, graph

**Block**:
A box that holds Traits and other Blocks and grows as things are put in it; Bob reads it as a part of the website to build or add.
_Avoid_: Node, container, frame, component

**Site Block**:
The one outermost Block of a Project before its first Build; Traits in it apply to the whole website.
_Avoid_: Root, project block

**Checkpoint Block**:
The locked Block that stands for the built site after a Build, showing its pages as locked Page Blocks; Blocks and Traits placed in it ask Bob for changes.
_Avoid_: Site snapshot, built block

**Page Block**:
A Block that stands for one page of the website; Page Blocks sit inside the Site Block.
_Avoid_: Screen, route

**Trait**:
A small floating concept that describes the Block it sits in, such as a color, a font, a function, a position or a link to a page; it describes that Block as a whole and is never copied onto the Blocks nested inside.
_Avoid_: Property, attribute, tag, primitive

**Note**:
Free text attached to a Block or Trait that tells Bob more about it.
_Avoid_: Comment, description, prompt

**Bob picks**:
The state of a Trait whose value the user handed to Bob, with its green bulb button or the "Bob picks" choice in its dropdown; Bob chooses that one value, guided by the Trait's Note. Not the "let Bob pick" Trait, which hands Bob a whole area of a Block.
_Avoid_: Auto, default, empty

**Loose idea**:
A Block or Trait on the Canvas outside the Site Block or Checkpoint Block; Bob ignores it, and a Build leaves it where it is.
_Avoid_: Draft, scrap

**Warning**:
A problem the app finds in the unbuilt Blocks before a Build, shown as a mark on that Block or Trait: either Bob will skip it, or it is worth a look. A Warning never fails a Build.
_Avoid_: Error, lint, issue

**Custom Block**:
A Block type the user defines once, in its own edit view, and places many times; editing it changes every Instance not yet built, except where an Instance was changed.
_Avoid_: Template, symbol, reusable block, main block

**Instance**:
One placed copy of a Custom Block; it follows the Custom Block, but changes made to it, parts added to it and parts removed from it stay in that Instance.
_Avoid_: Copy, usage

**Skill**:
Standing know-how on how to build websites well, which Bob reads alongside every instruction document. Every Skill is loaded on every Build, whatever Blocks it has. Users never see Skills.
_Avoid_: Plugin, template

### Library

**Library**:
The Project's collection of uploaded media that Traits can reference and Bob can use.
_Avoid_: Assets panel, uploads, gallery

**Asset**:
One uploaded media file (image or video) in the Library; sound is a stretch goal.
_Avoid_: File, media item, resource
