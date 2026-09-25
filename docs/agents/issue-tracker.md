# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files under `.scratch/` in this repo.

## Conventions

- **Create an issue**: create a new file at `.scratch/<feature>/<slug>.md`. Use a short kebab-case slug.
- **Read an issue**: read the markdown file directly.
- **List issues**: list files under `.scratch/` recursively.
- **Comment / update**: append to the file under a `## Updates` heading.
- **Apply a label**: add a `labels:` field to the YAML front-matter.
- **Close**: add `status: closed` to the front-matter and move to `.scratch/_closed/<feature>/<slug>.md` if desired.

## When a skill says "publish to the issue tracker"

Create a new `.scratch/<feature>/<slug>.md` file.

## When a skill says "fetch the relevant ticket"

Read the corresponding `.scratch/` file.
