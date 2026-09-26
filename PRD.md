# Scrabby PRD

Status: complete for the hackathon build (updated 2026-09-26 for the build: Bob runs the product, hosted on Vercel); nothing is `OPEN`. Readers: the two developers, and Bob.
Vocabulary: [`CONTEXT.md`](CONTEXT.md). Hard-to-reverse decisions: [`TDD.md`](TDD.md) §0. How it looks: [`DESIGN.md`](DESIGN.md). How it is built: [`TDD.md`](TDD.md). Build order: [`plan/build-map.md`](plan/build-map.md). Rules for Bob: [`AGENTS.md`](AGENTS.md).
Where this PRD and the TDD disagree on a mechanism, the TDD wins: it describes the team prototype that this build replicates. Where DESIGN.md and TDD §18 disagree, TDD §18 wins.
`OPEN` marks something that is not decided yet. Do not build an `OPEN` item on a guess.

## 1. Event

- lablab.ai IBM Bob 2.0 Hackathon. Online, 48 hours, from 2026-09-25 15:00 UTC to 2026-09-27 15:00 UTC.
- Team: two developers who use AI tools. We build the product with Bob.
- The hackathon code starts in a fresh repo at kickoff. This PRD goes in as Bob's context. The build replicates the team prototype (built before kickoff in the planning repo) from the TDD; no prototype code is copied.
- Theme: "improves a specific developer workflow, such as onboarding, debugging, code review, testing, application maintenance, or release and deployment". Our workflow is **onboarding** (§2).
- Judging: four criteria, each scored 1–5, with no published weights. They are Application of Technology (complete, clearly uses IBM Bob 2.0), Presentation, Business Value and Originality. A video shorter than 3 minutes scores 2 on Presentation.
- Host: Vercel Hobby (free). The submission form's platform is Vercel, and the app URL is the `*.vercel.app` link. The demo stays free and ad-free, as Hobby's non-commercial rule requires.
- Schedule (both developers sleep 00:00–08:00 local time, UTC+7):
  - Hour 34 (Sun 2026-09-27 01:00 UTC, 08:00 local): one developer moves to the submission package (§13).
  - Hour 40 (07:00 UTC, 14:00 local): feature freeze. The other developer builds until then; after it, only fixes.
  - Submit at 13:00 UTC (20:00 local), 2 hours before the 15:00 UTC deadline.

## 2. Problem and pitch

Locked (PRD-28):

> Young developers learn to code in Scratch, but what they make stays inside Scratch. AI tools can now build real websites, but only if you can describe what you want in words, and kids find it hard to put their ideas into a clear prompt.
> Scrabby lets them plan the way they already know from Scratch. They snap their idea together as Blocks and Traits on a Canvas, and it feels like a game. Bob turns the plan into a real website they can click through. Then they open the real code, change it, and ask Bob what it does.

- **The goal, locked (PRD-44).** These words are used as written in the video at 2:30 and on the deck's value slide:
  - Headline: "Your idea shouldn't need perfect words."
  - What Scrabby does: "Scrabby removes the prompt-writing barrier. Young developers plan their idea as Blocks, the way they already know from Scratch, and Bob turns the plan into real, working software. Then they read and change the real code, so they learn how it works along the way."
  - The developer workflow it improves (the hackathon theme): "The first step of every project: getting from an idea to a working prototype. Scrabby makes it faster (idea to a clickable website in under 10 minutes) and removes rework (hand edits survive every rebuild)."
  - Supporting line: "Kids who code are developers too. Scrabby is how the next generation gets onboarded to real code."
  - Evidence line: "Research is moving past the blank text box: replacing a chat box with point-and-click editing made people 50% faster."
- The video and deck center on young developers (PRD-41).
- Numbers to show on camera: time from idea to a clickable website (target: under 10 minutes); hand edits kept across rebuilds (all of them).
- What the kid comes away with: a real website to show people (the demo's hook); the skill of giving an AI precise instructions; real HTML, CSS and JS, learned by reading and editing (the headline claim).
- **Evidence for the video and deck** (PRD-45). Every claim on a slide or in the narration comes from this list, with its source on the slide:
  - Writing is hard for kids:
    - Only 27% of US eighth-graders write at NAEP's Proficient level (NCES, *Writing 2011*, NCES 2012-470, the latest released). Say "NAEP Proficient", not "grade level".
    - In England, 27% of 11-year-olds missed the expected standard in writing in 2026 (DfE, *Key stage 2 attainment 2026*, https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment).
  - Prompting is hard for kids:
    - When 63 French students aged 14–15 asked ChatGPT science questions in their own words, 38.9% of the answers were high-level, against 84.4% with expert-written prompts. They also judged prompt quality no better than chance (Abdelghani et al., 2025, preprint, https://arxiv.org/abs/2505.01106).
    - When 33 learners aged 10–17 used an AI code generator, 52% of their prompts were copied straight from the task text. A single big prompt trended with lower test scores, and breaking the task into parts trended with higher ones (Kazemitabaar et al., Koli Calling 2023, https://austinhenley.com/pubs/Kazemitabaar2023Koli_LLMsCS1.pdf).
    - Asked how they would tell a computer to run Pac-Man, 10- and 11-year-olds wrote plans with "a large amount of imprecision and underspecification" (Pane, Ratanamahatana and Myers, *IJHCS* 2001, https://john.pane.net/pdf/PaneRatanamahatanaMyers2001.pdf).
  - Prompting is hard for beginners of any age: 120 beginning coders "struggle with writing and editing prompts, even for problems at their skill level" (Nguyen et al., CHI 2024, https://arxiv.org/abs/2401.15232). So today's adults-only build helps real users, while kids are the vision.
  - Beyond the text box:
    - Replacing a chat box with point-and-click editing made people 50% faster, with 50% fewer and 72% shorter prompts (Masson et al., CHI 2024, 12 adults, https://arxiv.org/abs/2310.03691).
    - Machine-written prompts matched or beat human-written ones on 19 of 24 tasks (Zhou et al., ICLR 2023, https://arxiv.org/abs/2211.01910).
    - Say "research is moving past the blank text box". Don't say "the future of prompting isn't typing": no usage data shows typed prompting fading.
  - Blocks help novices: they favour "recognition over recall" (Bau et al., *CACM* 2017). Students who began with blocks showed "greater learning gains and a higher level of interest" (Weintrop and Wilensky, 2017).
  - The audience:
    - Scratch has 135.1M registered users (its own statistics, snapshot 2024-07-14). 58.7% of those with a known age signed up aged 8–14, with the peak at 12.
    - CodeAI (formerly Code.org) says it has reached 150M+ students.
    - The US has 25.7M public-school students in grades 3–9 (NCES, fall 2022).
    - Don't add Scratch's and CodeAI's numbers together: the audiences overlap.
  - Limits to own if a judge asks:
    - Adults in Pane et al. were about as vague as the children.
    - In one study, kids aged 7–12 using an AI helper in Scratch still preferred text chat.
    - No large study has measured 8–14-year-olds writing prompts for a website generator.
  - Full sources: `docs/research/prompting-evidence.md` and `docs/research/market-and-competitors.md`.
- **Opening narration** (0:00–0:30, PRD-45): "Maya is 11. She's made games in Scratch, and now she wants a real website for her class bake sale. AI can build websites, but only if you describe exactly what you want. That's hard for kids: only 27% of US eighth-graders write at a proficient level, and when 14- and 15-year-olds asked ChatGPT in their own words, 39% of the answers were high-level, against 84% with expert prompts. Maya has the ideas. What she's missing is the perfect words."
- **The product is named Scrabby** (PRD-49). It was called spbob in earlier planning; the repo folder keeps its old name.
- **The word "Scratch", its logo and the Scratch Cat** never appear in the product's name, logo or UI text. Scratch's terms limit its marks to "personal, educational, and non-commercial purposes". The pitch, deck and video may mention Scratch only as a plain-text fact ("kids who know Scratch"), never with the logo or the Cat. Copying Scratch's colors and layout is fine as long as Scrabby keeps its own name, logo and icons.
- Business value comes from the idea: the size of the audience, the gap no competitor fills, and the evidence that beginners struggle to write prompts. Open source is not the selling point; a public MIT-licensed repo is a hackathon requirement. The deck still shows a revenue model, because the scoring rewards one by name (PRD-37):
  - free for learners;
  - schools pay for a hosted School Edition (it covers the AI costs, school or parent consent, and teacher tools);
  - families can buy extra AI credits;
  - sponsors fund the free tier;
  - the code stays MIT open source.

## 3. Users

- **Vision:** young developers, roughly ages 8–14, who know Scratch.
- **Hackathon build: adults only.** The AI providers we can use today do not allow users under 18. The demo is for adult judges and uses sample Projects. Stated users: adult beginners, and adults who teach kids to code.
- **Roadmap:** kids get access through schools and parents, who give consent, on an AI provider that allows child users.

## 4. Core loop

The user moves through three **Steps**, one on screen at a time: **Plan › Build step › Try & tweak**.

1. **Plan:** the user lays out a website or simple web app on the **Canvas** with nested **Blocks** and **Traits**, and uploads images and videos to the **Library**.
2. **Build step:** the user clicks **▶ Build**. Bob reads the Blocks and writes a clickable **Prototype**. The Build step shows progress, and it stays on screen if the Build fails.
3. **Try & tweak:** the user clicks through the **Preview**, edits the code by hand, and asks the **Assistant**.
4. **The next Build** edits the existing code and keeps the hand edits.

**A Build consumes its Blocks** (ADR 0005, TDD §0):
- A finished Build saves a **Checkpoint**: the code and the Blocks that made it. Its Blocks leave the Canvas. The Canvas then holds one locked **Checkpoint Block** that stands for the built site, with one locked Page Block per `.html` file, plus any loose ideas.
- The next Build's Blocks go inside the Checkpoint Block and ask only for what they add or change. New Blocks drop into a locked Page; new Page Blocks drop into the Checkpoint Block. A Trait dropped on a locked Page is a change request for that page; on the Checkpoint Block, for the whole site. There are no locked Blocks deeper than a page: a detail inside a built page changes by hand, with the Assistant, or with a page-level request.
- Users never see the text Bob reads. There is no "built" badge: built Blocks are no longer on the Canvas.
- **▶ Build** is only in Plan. When no new Blocks were added since the last Build, it is greyed out with the hint "Nothing new to build. To redo a Build, open **Checkpoints**"; the link opens the Checkpoints tab.

**Checkpoints tab** (ticket 06): a third tab in Plan, next to Canvas and Library.
- Each entry shows "Checkpoint N", the time, and a gist of what it added (from its Blocks' names). The current one is marked, with "+ unsaved hand edits" when the code changed since.
- **Go back to this:** the code becomes the code after that Build, and the Canvas holds that Checkpoint's Block.
- **Edit its Blocks:** the code goes back to how it was before that Build, and that Build's Blocks come back editable inside the previous Checkpoint Block. Building then retries that step; the result may differ. On Checkpoint 1 this clears the code and brings the Site Block back.
- Both actions show a warning first, because the code reverts. If the Assistant has changes the user hasn't accepted, the warning adds "The Assistant's unaccepted changes will be dropped."
- Before loading, if the code has hand edits that no Checkpoint holds, the app saves it as "Before loading Checkpoint N". These code-only Checkpoints offer only Go back to this.
- Unbuilt Blocks on the Canvas become loose ideas when a Checkpoint loads. Loading never changes the Library.
- The list only grows. A Build made after loading an older Checkpoint is labelled "from Checkpoint N" (or "remade from scratch").

Moving between the Canvas and the code: "See its code" on a Block in the Checkpoints tab's Block list, and Block chips in the code (ticket 02). A Block chip opens the Checkpoints tab at the Build that made that code, with its Block highlighted.

Fixed rules: ADRs 0001, 0002, 0003, 0005 (TDD §0).

What users can make: websites, and simple web apps with no backend (a quiz, a to-do list). Games come later.

## 5. Bob and the Assistant

- Runtime (W-19, updated 2026-09-26): **IBM Bob runs the product** through its OpenAI-compatible inference endpoint (`https://api.us-east.bob.ibm.com/inference/v1`, an Inference API key, `Authorization: Apikey <key>`). The server drives it with our own file tools (TDD §5). The endpoint is configured only by environment variables, so any other OpenAI-compatible model (for example Gemini's) can stand in with a settings change and no code change, if Bob access or Bobcoins run out before judging ends. The badge then names that model.
- **Every product Build and Assistant answer spends the Bobcoins of the account that owns the Inference key.** Watch its balance (Bob IDE → Settings → General) and switch the variables to a fallback model before it runs out.
- The UI always calls the agent **Bob**, with a badge naming the model that runs it. The video and deck say plainly which model ran the demo.
- The Prototype is plain HTML, CSS and JS with no npm: one `.html` per Page Block, a shared `style.css` and `script.js`, and Assets in `assets/`.
- **Download** (PRD-48): a zip with the website files and Assets only, which runs by double-clicking `index.html`.
- All product code is written in the Bob IDE. The Bobcoin budget sets the drop order (§6).

**Assistant** (ticket 08): the chat panel where the user talks with Bob about the code.
- It lives only in Try & tweak. In Plan, hover tooltips explain each Block and Trait instead (§11).
- **What Bob sees** when the user asks something: the list of Prototype files, which Bob reads with its `view` tool; the text each past Build sent, as read-only files `.builds/build-N.md`; the file open in the editor and any lines the user selected; the last Build's card (its checklist); and the names of the Library's images and videos. Bob never sees the Canvas or unbuilt Blocks. It explains a Build from what that Build asked for and never invents the Build's reasoning. `.builds/` is never in the Download.
- **Explanation level** (PRD-36): a small picker at the top of the Assistant, "Explain: very simply · simply · in detail", defaulting to "simply". It only changes how Bob words its answers. No ages appear on screen. The deck and video say that in the kids' version these levels match ages 7, 9 and 12.
- Bob changes code only, as diffs. When a fix belongs in the Blocks, Bob says in words which Block to add (for example "put a Footer Block in the Checkpoint Block").
- Every answer from Bob explains in plain words what the code does or what the change does, because learning the code is the headline claim.
- **Diff card:** a plain-words summary of what will change (1–3 short lines, written by Bob) and which files it touches, with **Accept all**, **Reject all** and **Review**. Review opens the file in the code editor's merge view, where each change has its own Accept and Reject. Raw code shows only in the editor. Anything accepted reloads the Preview.
- Accepted changes count as hand edits, so the next Build keeps them. Accepting saves no Checkpoint.
- If a file an open diff touches changes after Bob proposed it, whether a Build or the user's own typing changed it, the card turns **Out of date** and offers **Ask again** and **Dismiss**. Bob returns whole files, so applying an old proposal would silently wipe the newer change.
- The chat is saved with the Project. Bob receives only the last 10 messages of it.
- Bob helps only with this Project's code and Blocks, and politely steers anything else back.
- The Assistant cannot be used during a Build, because the Build step is on screen while a Build runs.
- If the user presses ▶ Build while the Assistant has changes the user hasn't accepted, a popup says "The Assistant has changes you haven't accepted. Building drops them." with **Cancel** and **Build anyway**. A Build never runs on a half-applied change.

## 6. Hackathon cut list

Tasks and Bobcoin estimates are set by the build plan, made after the team prototype. If time or Bobcoins run low, drop in this order (PRD-38): the show-around, then the Preview error bar, then the Assistant.

Build in this order:

| Tier | Feature |
|---|---|
| Must | Step bar and the three Steps' screen layout (ticket 02) |
| Must | Canvas: workspace, pan and zoom, palette |
| Must | Canvas: Blocks, Traits, value editing in place, Notes, folding, hover tooltips (§11) |
| Must | Canvas: dragging with the drop shadow and indicator line |
| Must | "Bob picks" on each Trait (§11) |
| Must | Warnings: marks on Blocks and Traits, and the stepper (§10) |
| Must | Build: the Blocks turned into the text Bob reads (never shown to users); Bob writes the code; the Build step shows progress; the Build consumes its Blocks into a Checkpoint and the locked Checkpoint Block (§4) |
| Must | Checkpoints tab: Go back to this, Edit its Blocks (§4) |
| Must | Preview: redraws a moment after typing stops, with a "Pause live updates" switch; the changed parts flash after a Build or an accepted change (W-16, W-17) |
| Must | Code editor; the next Build keeps hand edits |
| Must | Library, images and video, with the image and video Traits |
| Must | Save one Project in the browser (with its chat); Download code as a zip (PRD-48) |
| Must | Guardrails (§8) |
| Must | Onboarding (§9): sample Project, hints, New Project, a short show-around |
| Must | Preview error bar (§10) |
| Must, last | Assistant (§5). The first thing to drop if Builds cost more than planned |
| Must | Custom Blocks (ADR 0003): Make Custom Block, edit view, Instances with overrides. The demo's Top bar and Bottom are Custom Blocks |
| Stretch | Project list (a home screen) |
| Stretch | A check after each Build: links, images and pages that fail to load (PRD-47) |
| Stretch | Sound: sound uploads, the sound Trait and the "plays a sound" action |

Until sound ships, upload accepts images and video only, and the sound Trait and "plays a sound" are hidden from the palette. The video size cap is decided during the build (lean: keep 25 MB per file).

If the Assistant is dropped, everything that depends on it goes too: the diff card and its states, the saved chat, and the Preview error bar's **Ask Bob to fix it** button. Build no button that leads to a missing feature.

## 7. Demo script and success criteria

- **Story** (PRD-39): Maya, 11, is made up. The video tells how she *could* use Scrabby to build a quick project for her own needs. No child appears or takes part: the team plays Maya's part on screen. Her project is the demo site.
- **The demo site: "Maya's bake sale"** (Site: color pink, vibe playful, font "friendly" typed in custom…):
  - A Navbar with buttons that go to the Menu and the Quiz (position: stays on top when scrolling).
  - Home: a full-width Hero (a headline and a photo slideshow) and an **Order** button that opens a Popup with an Order form (a Note says what it asks; on click: submits, fake). A "Next sale" Section counts down, with a Panel of a photo and a half-price line.
  - Menu: a Card grid of cakes (fake data: 6 cakes with prices and photos; sort by price, fake), each Card adds to the cart (fake).
  - Quiz: "Which cupcake are you?", a Section with a tell Bob Trait (3 questions), a let Bob pick Trait (the colors) and a Button (on click: checks an answer).
  - A Footer: "Made by Maya, age 11".
  - The demo uses every Block and every Trait except sound and video. Its three Pages sit side by side on the Canvas.
  - The photos are in the demo's Library.
- **Where it shows:** behind the Demo button on the live link (§9), in the video's demo, on one deck slide (the Canvas beside the finished site), and on the cover image.
- **Proof of "under 10 minutes"** (PRD-40): record the real planning session, from an empty Site to the first Build, with a clock on screen. Play it sped up in the video.
- **Video outline** (about 4:45, centered on young developers, PRD-41):
  - 0:00–0:30 **The problem, through Maya:** the opening narration in §2.
  - 0:30–2:00 **The demo:** Maya's plan in Blocks (the sped-up recording with a clock), then Build, clicking through her site, a hand edit, asking Bob at "very simply", accepting the change, adding a Trait and rebuilding with the edit kept, and Download.
  - 2:00–2:30 **Built with IBM Bob:** clips of our Bob IDE sessions, naming Agent mode, subagents, parallel tasks and document understanding (Bob built Scrabby from these docs). Then one line that matches what the Bob badge shows on recording day:
    - If IBM Bob runs the product: "Bob builds it inside Scrabby, and you keep building with the same Bob in the IBM Bob IDE."
    - If a fallback model stands in (only if Bob access ended): "Scrabby is built for Bob. In this demo another model stands in, as the badge shows. Drop in a Bob key, and Scrabby runs on Bob. Download the project, and you keep building with Bob in the IBM Bob IDE."
  - 2:30–4:00 **Why it matters:** the locked goal words in §2 (including the evidence line), the market, the competitor chart and the revenue model.
  - 4:00–4:45 **Roadmap and team:** the kids' version through schools and parents on an AI provider that allows children, explanation levels matched to ages 7, 9 and 12, games later, and which model ran the demo.
- **Checklist before submitting** (PRD-42). The submission-package developer runs it at hour 38 (Sun 05:00 UTC, 12:00 local) and again after the final deploy, before submitting:
  1. In a fresh browser, the link opens Plan, and the demo site loads (PRD-43).
  2. Building the demo site takes under 2 minutes. This is unmeasured, so time one real Build on day 1. If it's slow, trim the site or lower Bob's thinking level for Builds.
  3. Every link, the popup, the form and the quiz work in the Preview.
  4. A hand edit survives a second Build.
  5. An Assistant change can be accepted and shows in the Preview.
  6. Download gives a zip whose `index.html` opens with a double-click.
  7. It works in Chrome and Firefox at 1366×768 and 1920×1080.
  8. The repo has no keys, has a `LICENSE` file, and its README says which model runs Bob.
  9. No real child appears in the video.

## 8. Safety guardrails

Ticket 10, settled with PRD-30 and PRD-35. The hackathon build is for adults: IBM says its services are "not intended for use by children or minors", and lablab's own terms require users to be 18 or older.

1. **Bob badge:** the model's name is always shown, so users know they're talking to an AI.
2. **Keys stay on the server,** never in the browser or the public repo.
3. **Usage limits** (W-21): each browser gets 10 Builds and 40 Assistant messages per hour. For everyone together, the daily limit is 40 Builds and 150 Assistant answers. The Bobcoin balance of the key's account is the backstop: when it runs low, switch to a fallback model (§5). Counts live in the running server function, so they are approximate (W-20); they key on a per-browser id, never on IP. The messages:
   - For one browser: "You've used this hour's 10 Builds. Try again in N minutes." For questions: "You've asked Bob 40 questions this hour. Try again in N minutes."
   - For everyone: "Scrabby has reached today's limit for everyone. Please try again tomorrow."
4. **On topic:** Bob helps only with this Project's code and Blocks (§5).
5. **The model's own safety filters stay on.**

Not in the hackathon build: a Report button and a log of flagged messages. They come with the kids' version.

## 9. Onboarding

The judges open the link cold, so the first visit has to work without help.
- **Demo site:** it does not open by itself. The first visit opens an empty Project. The demo site (a finished plan, ready to Build; contents in §7) loads from two places (PRD-43): a big **Try the demo: Maya's bake sale** button on the empty Canvas, and a **Demo** button in the menu bar. Loading it replaces the current Project. If that Project isn't empty, a warning shows first: title "Load the demo?", text "This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code.", buttons **Download code** · **Cancel** · **Load the demo**.
- **Short show-around:** speech bubbles, one at a time, with Next and Skip. Replay it from **Show me around** in the menu bar. The words:
  - Plan, first visit:
    1. Palette: "These are your Blocks and Traits. Drag one onto the Canvas to use it."
    2. Canvas: "This is your plan. Put Blocks inside Blocks, and drop a Trait into the Block it describes. Where things sit doesn't matter."
    3. Build button: "When your plan is ready, press Build. Bob turns it into a real website."
    4. Step bar: "You move through three steps: Plan, Build, Try & tweak. You can come back to Plan any time."
  - Try & tweak, the first time it opens:
    5. Preview: "This is your website. Click around: links, buttons and forms work."
    6. Assistant: "Ask Bob about the code, or ask for a change. You decide whether to keep each change." (Left out if the Assistant is dropped.)
- **Empty Canvas hint:** "Drag a Page into your Site to start."
- **One-time tip:** "Right-click a Block or Trait for more." Right-click is the only way to reach Notes, Duplicate and Delete.
- **New Project:** a menu-bar button that starts an empty Project, after a warning, because only one Project is saved:
  - Title: "Start a new Project?"
  - Text: "Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code."
  - Buttons: **Download code** · **Cancel** · **Start a new Project**.
- **Hover tooltips** on every Block and Trait (§11).

## 10. Build failure

Ticket 29, settled 2026-09-25.

- **All or nothing.** A Build writes files only when it finishes. A failed Build writes nothing, saves no Checkpoint, and leaves its Blocks on the Canvas, editable. The Block chips lit during the run go back to dim.
- **The failed Build card** stays on the Build step. Title: "Build N did not finish". Under it: "Nothing changed: your code and Blocks are as they were." Then the failing line, red, in plain words:
  - Time cap: "Bob took too long, so this Build was stopped."
  - Step cap (40 tool rounds): "Bob ran out of steps before finishing, so this Build was stopped."
  - The model can't be reached or returns an error: "Bob couldn't be reached. Check your connection and try again."
  - The answer is broken or incomplete (for example bad JSON): "Bob's answer came back broken, so this Build was stopped."
- **Actions:** **Try again** (Primary) reruns the same request. **← Back to the Blocks** (ghost) returns to Plan. There are no other actions.
- **Time cap:** 4 minutes (240 s) per Build, under Vercel's 300 s function limit. There is no Stop button while a Build runs; the time cap stops a stuck Build.
- **Usage limits** (§8) are not failures: the Build never starts, and the limit message shows. A failed Build counts toward the Build limits, because it still spent tokens. Try again has no other limit.
- **Errors in the Preview** (broken code from a finished Build, a hand edit or an accepted diff): a thin bar under the Preview says "Something on this page isn't working", with the error in small text and an **Ask Bob to fix it** button. The button asks Bob in the Assistant, sending the error and the file, and Bob answers with a diff. The bar stays until the page runs without an error. It is a bar, not a toast, because a toast disappears before a beginner reads it, and the error stays until it is fixed. If the Assistant is dropped, the button becomes **Open the file**.
- **A link to a page with no file** shows a one-line page in the Preview: "This page has no file yet."
- **A check after each Build** (PRD-47) is stretch (§6). Until it ships, a Build cannot find broken code; the Preview's error bar and the "This page has no file yet" page cover most problems.
- **Problems in the plan** (PRD-46) never stop a Build. Only a plan with no Site Block or no Page Block stops it, with the message "Add a Page inside your Site first." Bob skips a broken item, and the Build card shows a quiet line in plain words, for example "Skipped: the Shop now button goes to a page that no longer exists."

**Warnings** (ticket 24) mark plan problems on the Canvas before the Build:
- A Warning is an orange ring on the Block or Trait, with a badge: "!" means Bob skips it, "?" means it's worth a look.
- Clicking the badge opens a popover: where it is (a clickable path such as "Home › Big welcome › See the sale"), what is wrong, and what to do. Buttons: **Show** (moves the Canvas to it and flashes it), **Pick one** (focuses its dropdown or field), and **Close** (Pick one only on a Trait). There are no one-click fixes. Copy is plain and direct, for example "Nothing opens the "Sign up" popup, so visitors never see it."
- A stepper at the top right of the Canvas, "‹ ⚠ N to check ›", jumps between Warnings in reading order: the Site first, then each Page, top to bottom through the Block tree. With no Warnings, a small green "✓ Nothing to check" pill shows in its place.
- Only unbuilt Blocks inside the Site Block, or inside the Checkpoint Block after a Build, are checked. Built code is never scanned. Locked Pages and the Checkpoint Block are valid link targets and are never marked. Loose ideas are never marked.
- A new or focused Block or Trait gets its mark once the user clicks or drags somewhere else. Everything else updates live.
- What is checked:

  | Warning | Kind |
  |---|---|
  | "on click" goes to a deleted page | Bob skips it (the link does nothing) |
  | "on click" opens a deleted popup | Bob skips it |
  | "on click" with nothing picked | Bob skips it |
  | An image or video Trait with no file picked | Bob skips it |
  | An image or video Trait whose file was deleted from the Library ("The picture 'hero-photo.jpg' was deleted from the Library.") | Bob skips it |
  | A Popup that nothing opens | worth a look |
  | A Page nothing links to (not the home Page) | worth a look |
  | An empty Page | worth a look |
  | An empty text or fake data Trait, or a dropdown left blank on "custom…" ("…is empty, so Bob will write the words.") | worth a look |
  | An empty "tell Bob" | always marked |
  | An empty "let Bob pick" | never marked: it means "anything" |

- A Note on the item, or a "tell Bob" or "let Bob pick" in its Block, clears a "worth a look" Warning. "Bob skips it" Warnings stay until fixed. There is no Ignore button.
- A Trait set to "Bob picks" (§11) is not empty, so it gets no Warning. An "on click" set to "Bob picks" does not count as a link to a Page or Popup.
- A problem in a Custom Block's definition marks every Instance but counts once in the stepper, and its popover adds "Comes from the Custom Block "Product card"". The Custom Block edit view shows no Warnings.

## 11. Trait values

Tickets 22 and 27. Every dropdown ends with "custom…", which lets the user type any value. The palette is set in ticket 01. Defaults are the ones in the ticket 27 prototype.

| Trait | Category | Input | Values | Default |
|---|---|---|---|---|
| color | Design | swatches, then "Any color" | 12 presets, each sent to Bob as name and hex: coral `#FF8A80`, pink `#F8BBD0`, orange `#FFB74D`, sunny yellow `#FFE066`, lime `#C5E1A5`, mint `#A8E6CF`, sky blue `#81D4FA`, navy `#1E3A5F`, lavender `#C5B3F6`, brown `#8D6E63`, black `#111111`, white `#FFFFFF`; or any color, sent as its hex | `#3B82F6` |
| font | Design | dropdown, each font shown in its own typeface | Google Fonts: Nunito, Poppins, Merriweather, Playfair Display, Caveat, Space Mono, Bebas Neue, Pacifico. "custom…" takes any Google Font name or a feeling ("something cozy"), and Bob picks a font to match | Nunito |
| vibe | Design | dropdown | playful, calm, bold, minimal, elegant, retro | playful |
| size | Design | dropdown | small, medium, large, full width, full screen | medium |
| position | Design | dropdown | inside the parent Block: top, bottom, left, right, center, stays on top when scrolling, floating corner | top |
| on click | Behavior | dropdown | go to page › (every Page), open popup › (the Popups on this page), submits (fake), adds to cart (fake), shows / hides what's inside, adds to a list, checks an answer, counts clicks, remembers on this device (in the Preview this resets on each rebuild; the downloaded site keeps it) | none |
| purpose | Behavior | dropdown | what the Block does by itself, no click needed: slideshow, countdown, search (fake), filter / sort (fake), appears on scroll | slideshow |
| fake data | Behavior | text | free text | "6 items with prices" |
| text | Content | text | free text | "Hello!" |
| image | Content | Library picker | the Library's images | none ("pick from Library") |
| video | Content | Library picker | the Library's videos | none ("pick from Library") |
| tell Bob | Talk to Bob | text | free text; hint "like make it feel cozy" | empty |
| let Bob pick | Talk to Bob | text | what Bob decides; hint "like the colors". Empty means anything in this Block | empty |

- **"on click" replaces "does" and "goes to".** Both answered "what happens when a visitor clicks this". What a Block does without a click is the **purpose** Trait.
- **Traits do not cascade.** A Trait describes its Block as a whole, including what's inside it. Bob keeps nested Blocks consistent with it without copying it. A Trait set on a nested Block decides that Block.
- **Two Traits of the same kind in one Block** are used together where they can be (two colors make a palette, two fonts make a heading font and a body font, two "on click" steps both run), and Bob picks one where they clash. Going to a page always happens last.
- **Stretch** (§6): the sound Trait and the "plays a sound" action.

**Bob picks** (ticket 27): hands one Trait's value to Bob.
- Every dropdown ends with "💡 Bob picks", just before "custom…". This covers the choice Traits, "on click", and the image and video Traits.
- A color Trait, and a text or fake data Trait while its field is empty, shows a round green bulb button beside the value. One click hands the value to Bob.
- Set, the value turns into a green chip: the bulb icon, "Bob picks" and an ×. Beside it sits a hint field ("hint, like something warm"), which gets focus. The hint is optional and is the Trait's Note, so no separate Note field shows. **×** takes the value back and restores the old value; the hint stays as the Note.
- "tell Bob" and "let Bob pick" get no Bob picks control.
- Bob reads the Trait as `label (meaning): you choose`, with the hint as its Note. For an image or video Trait, Bob picks a fitting Library Asset, otherwise a placeholder. For "on click", Bob picks an action that fits.
- The "let Bob pick" Trait stays, for bigger asks on a whole Block, such as "the colors".

**Hover tooltips.** Resting the pointer on a Block or Trait, in the palette or on the Canvas, for about half a second shows one short sentence about it. There are no tooltips during a drag. Each type's definition holds its tooltip text:

| Type | Tooltip |
|---|---|
| Site | Your whole website. Traits here apply to every page. |
| Page | One page of your website. Put it inside {the Site / the Checkpoint}. |
| Checkpoint (the Checkpoint Block) | Your website as Bob built it. Drop in Pages or Traits to ask for changes. |
| Built page (a locked Page Block) | A page Bob already built. Drop Blocks or Traits here to change it. |
| Navbar | The menu bar with links, usually at the top of every page. |
| Hero | The big first thing people see on a page: a headline, a picture, a button. |
| Section | A part of a page that groups things together. |
| Card grid | A grid of cards, like products or photos. |
| Card | One box with a picture, some words and maybe a button. |
| Form | Boxes people type into, with a Send button. Sending is pretend. |
| Popup | A small window that pops up over the page. |
| Footer | The strip at the very bottom of a page. |
| Textbox | Words on the page. |
| Frame | A picture from your Library. |
| Button | Something people click. |
| Panel | An empty panel that holds other Blocks. |
| color | The main color of this Block. |
| font | The style of the letters. |
| vibe | The overall feeling, like playful or calm. |
| size | How big this Block is. |
| position | Where this Block sits. |
| on click | What happens when someone clicks it, like opening a page or a popup. |
| purpose | What this Block does by itself, like a slideshow. |
| fake data | Pretend content that Bob makes up, like 6 products with prices. |
| text | The words this Block shows. |
| image | The picture this Block shows, from your Library. |
| video | The video this Block shows, from your Library. |
| tell Bob | Tell Bob anything the other Blocks can't say. |
| let Bob pick | Let Bob decide something for you, like the colors. |

- **{the Site / the Checkpoint}** reads "the Site" until the first Build and "the Checkpoint" once the Checkpoint Block is on the Canvas (ticket 32).
- **Loose ideas** (a Block or Trait outside the Site Block or Checkpoint Block) add a third line under the type's sentence: "Loose idea: Bob ignores it until you move it into {the Site / the Checkpoint}."

## 12. Out of scope

- Users under 18 in the hackathon build (they are the roadmap, §3).
- Games (roadmap).
- Pricing: Scrabby is free and open source.
- Accounts, cloud saves and public sharing.
- Real backends in Prototypes (databases, logins, payments).
- Deploying or hosting the user's Prototype. No multiplayer.
- Users who bring their own Bob or model key.

## 13. Submission package

Owner: the developer who moves over at hour 34 (§1). Submit at Sun 13:00 UTC (20:00 local).

**Form text and cover** (settled, PRD-49 to PRD-51). Keep "Scratch" out of the title and the short description, and mention it only once, as a plain fact, in the long description.
- Title (42 characters): "Scrabby - Plan in Blocks and Bob Builds It".
- Short description (203 characters): "Young developers plan a website as Blocks, the way they already build with block code. Bob turns the plan into real HTML, CSS and JS they can click through, edit and learn from. No perfect prompt needed."
- Long description (about 1,150 characters):
  > Kids who code are developers too, but AI builders expect them to describe a whole website in words, and that is hard. Only 27% of US eighth-graders write at NAEP's Proficient level, and when 14- and 15-year-olds asked ChatGPT in their own words, 39% of the answers were high-level, against 84% with expert prompts.
  >
  > Scrabby replaces the prompt with a plan. Young developers lay out their idea as nested Blocks and Traits on a Canvas, the way they already know from Scratch: a Page holds a Hero, which holds a Button that goes to the Shop. Bob, Scrabby's AI agent, reads the plan and writes a real website in plain HTML, CSS and JS. In Try & tweak they click through it, edit the real code and ask Bob what it does. Bob answers in plain words, at the level they pick, and proposes changes they accept or reject. The next Build keeps every hand edit. A download runs with a double-click.
  >
  > We built Scrabby with IBM Bob 2.0: we planned in documents, and Bob's Agent mode, subagents and parallel tasks built the product from them. A version for young coders will come through schools and parents.
- Tags: IBM Bob, Generative AI, AI Agents, Education, Web Development, Developer Onboarding, Block-based Programming, Vercel.
- Cover image (16:9, drawn by DESIGN.md): the Canvas with Maya's bake sale plan on the left, the finished site in the Preview on the right, and a green "▶ Build" arrow between them. Across the top: "Scrabby" and "Your idea shouldn't need perfect words." No Scratch logo or Cat, and no photo of a child.
- Logo: Bob, the builder robot mascot (`assets/Scrabby_2.svg`), plus the "Scrabby" wordmark (DESIGN.md Brand and Bob). Never the Scratch logo or Cat.

**The package:** Limits come from the submission form's own checks (re-checked 2026-09-24). Re-read the rules at kickoff, since lablab may change them; the Hackathon Guide is presented at 15:35 UTC on kickoff day.

- Title: 5–50 characters, only letters, digits, spaces and dashes. A colon or a comma is rejected.
- Short description: 50–255 characters. Long description: 600–2,000 characters.
- 16:9 cover image.
- MP4 video, 3–5 minutes, 300 MB at most: intro, then the slides, then the product working. lablab's own guide suggests the business case, market size and revenue model at about 2:30–4:00, and the team and roadmap at 4:00–5:00.
- One slide set serves both the video and the deck (PRD-40): the video walks through the slides, and the same slides are exported as the PDF. The PDF is mandatory ("MP4 and PDF formats are mandatory"), so the video can't replace it.
- PDF deck, 8–10 slides of 2–3 sentences each: problem, solution, demo screenshot, market size (TAM and SAM), revenue model, competitors and what makes us different, team, roadmap. The scoring rewards a revenue model by name, and a 5 on Presentation needs the competitor analysis.
- Open source: the public repo is MIT-licensed, as the rules require, with a `LICENSE` file from the first commit. A later paid edition that runs on IBM Bob would need its own agreement with IBM. The team keeps ownership, and lablab gets a non-exclusive licence. Don't advertise a live paid product on lablab; its terms forbid promoting business services there.
- Public repo on github.com under the MIT license, with no keys in it.
- Live Vercel URL.
- Bob session evidence in `bob_sessions/`: a screenshot of each task's summary, and each task's exported history.

## 14. Scoring check

An honest read of the idea against lablab's four criteria and the theme, as of 2026-09-24. Use it to shape the video and deck.

| Criterion | Likely score | Why | What lifts it |
|---|---|---|---|
| Application of Technology | 3–4 | Built entirely in the Bob IDE, with session evidence. The risk is completeness: the must tier is large for 48 hours and a limited Bobcoin budget, and the link must keep working through judging. | Show Bob's named features in the video: Agent mode, subagents, parallel tasks, and document understanding (Bob builds Scrabby from this PRD and DESIGN.md). Run Bob inside the product if the access allows it. |
| Presentation | 4–5 | The outline covers the problem, demo, market, revenue, competitors and roadmap in under 5 minutes. | Keep it 3–5 minutes. A 5 needs the competitor slide. |
| Business Value | 3, 4 with work | A large audience, a clear gap and a revenue model. But schools buy slowly, and kids' access needs consent and an AI provider that allows children. | Name a specific first customer (coding clubs and schools), give TAM and SAM, and show the School Edition. |
| Originality | 4–5 | No product we found turns a kid's block plan into real code with AI. | Stress the Bob link: the product's Bob runs on IBM Bob's inference endpoint, and Bob built Scrabby. |

- **The biggest risk is theme fit.** Judges may read Scrabby as an education product rather than a developer-workflow tool. The challenge asks teams to show "how your solution increases productivity, reduces manual effort, errors, and rework, or significantly shortens the time required". So one slide must show our numbers: idea to working prototype in under 10 minutes, and every hand edit kept across rebuilds (no rework).
- **The biggest lever is showing IBM Bob 2.0 clearly.** Both Application of Technology and Originality name Bob.
