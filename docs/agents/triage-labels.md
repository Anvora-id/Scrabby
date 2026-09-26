# Triage labels

Skills speak in five canonical triage roles. This repo records them as the `Status:` line of each issue in `plan/issues/`.

| Canonical role | `Status:` value | Meaning |
|---|---|---|
| `needs-triage` | `needs-triage` | New issue; a developer must check it and add it to `plan/build-map.md` |
| `needs-info` | `needs-info` | Stopped: the issue's `## Question` needs a developer's answer |
| `ready-for-agent` | `ready-for-agent` | Fully specified; Bob can do it once its `Blocked by:` issues are `done` |
| `ready-for-human` | `ready-for-human` | A developer does it (Vercel setup, keys, the done walk) |
| `wontfix` | `wontfix` | Will not be done |

One extra value closes an issue: `done` (checks passed, `## Answer` written).
