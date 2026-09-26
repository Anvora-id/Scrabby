# Issue tracker: local Markdown in `plan/`

Issues for this repo are Markdown files in `plan/issues/`. The index and build order are in `plan/build-map.md`.

## Conventions

- One file per issue: `plan/issues/NN-<slug>.md`, numbered from `01`. Never a single combined file.
- Near the top of each file: a `Status:` line (values in `triage-labels.md`), a `Blocked by:` line (issue numbers, or `none`), and a `Lane:` line.
- An issue is ready when its status is `ready-for-agent` and every issue in `Blocked by:` is `done`. Take the lowest ready number in your lane (`plan/build-map.md`, Lanes and order).
- **Finish:** tick the checkboxes, set `Status: done`, append an `## Answer` section with what the next issue must know.
- **Stuck:** append a `## Question` section with the exact problem, set `Status: needs-info`, and stop.
- **Comments and follow-ups:** append under a `## Comments` heading at the bottom.
- **New work** found while doing an issue: create the next free number, `plan/issues/NN-<slug>.md`, with `Status: needs-triage`, and add a row to the Issues table in `plan/build-map.md`.

## When a skill says "publish to the issue tracker"

Create a new `plan/issues/NN-<slug>.md` file as above.

## When a skill says "fetch the relevant ticket"

Read `plan/issues/NN-<slug>.md`. The user normally gives the number or the path.
