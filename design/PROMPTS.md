# Drafting prompts

Prompts for drafting icons in batches with an AI model (ChatGPT, Claude, or Sol). They ask for **SVG code, not images**. A raster image traced back to vectors gives lumpy paths with dozens of nodes, while a model writing SVG directly on the grid gives clean geometry that the validator can check.

## Workflow

1. Paste the **system prompt** once, then one **batch prompt** at a time.
2. Save each returned icon as `icons/<name>.svg` plus `icons/<name>.json`.
3. Run `npm run check`. Paste any `error` lines back to the model with "Fix these, same rules, return only the changed icons."
4. Open `site/dist/index.html` (after `npm run site`) and review at 16px, 24px and 48px. Ask for redraws by name, with one sentence on what's wrong ("reads as a download arrow, make it a vector mesh").
5. Commit per batch. CI runs the same checks.

## System prompt

````text
You are drawing icons for Burtson Icons, an open-source (ISC) stroke icon set by Burtson Labs.
The products it serves: local-first AI coding agents (CLI, IDE, extensions), a repository
security auditor that proves or refutes findings, a tamper-evident signed audit log (hash
chains, Merkle trees, signatures), self-hosted GPU / microVM / Kubernetes infrastructure,
document ingestion and vector search, forensic video and evidence handling for public-safety
teams, voice (speech-to-text, text-to-speech, cloning), and a bowling league app.

Output SVG code only, one icon per fenced ```svg block, preceded by a line `name: <kebab-name>`
and followed by a ```json block with {"tags": [...], "categories": [...], "contributors": ["sol"]}.

Hard rules (a validator rejects anything else):
- Root element exactly:
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
- Children: only path, circle, ellipse, rect, line, polyline, polygon, self-closing, with
  geometry attributes only (d, cx, cy, r, rx, ry, x, y, width, height, x1, y1, x2, y2, points).
  No fill, stroke, transform, style, class, id, groups, text, masks or gradients.
- All coordinates (stroke centreline) between 1 and 23; aim for 2 to 22. Max 2 decimals.
- A dot is a zero-length path: M6.5 12h.01
- Categories must come from: agents, development, security, provenance, infrastructure, data, evidence, voice, documents, status, interface, people, recreation, brand, operations, files.

Style:
- One idea per icon, 2 to 5 elements, readable at 16px.
- Parallel strokes need 4px centre-to-centre. Container corner radius 2 to 2.5, small inner shapes 1 to 1.5.
- A modifier (check, x, lock, clock, plus, slash) sits bottom right at about 7px, and the base
  shape's stroke is cut away around it with a 1.5px gap rather than overlapped.
- House vocabulary: shield = security, seal = signed or verified, spark (a 4-point plus) = AI,
  chip = model or compute, hexagon = cluster or node. No robots, no brains, no lightbulbs for "idea".
- Status variants of a base (shield-proof, shield-refuted ...) reuse the base path exactly.
- Be original. Do not reproduce or lightly edit paths from Lucide, Feather, Tabler, Heroicons,
  Material or any other icon set; a checker compares geometry against Lucide and rejects copies.
  Drawing the same concept your own way is fine.

Style references (existing Burtson Icons, match their weight and radius):

name: shield-proof
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2.5 4 5.5v6c0 4.9 3.4 8.6 8 10 4.6-1.4 8-5.1 8-10v-6z" />
  <path d="m8.5 12 2.5 2.5 4.5-5" />
</svg>

name: merkle-tree
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="4" r="2" />
  <circle cx="6.5" cy="12" r="2" />
  <circle cx="17.5" cy="12" r="2" />
  <path d="M11 5.75 7.5 10.25M13 5.75l3.5 4.5" />
  <path d="M5.75 13.9 3.5 18.5M7.25 13.9l2.25 4.6M16.75 13.9l-2.25 4.6M18.25 13.9l2.25 4.6" />
  <path d="M3.5 20.5h.01M9.5 20.5h.01M14.5 20.5h.01M20.5 20.5h.01" />
</svg>

name: agent-terminal
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="4" width="20" height="16" rx="2.5" />
  <path d="m6 9 3 3-3 3" />
  <path d="M11 16h3" />
  <path d="M18 6.5v4M16 8.5h4" />
</svg>

````

## Batch prompt template

```text
Draw these icons. Concepts are starting points; "x-free" means avoid that cliché.
For each, return name, svg and json as specified.

<paste the batch list here>
```

## Redraw prompt

```text
These icons fail review. Redraw only these, same rules:
- <name>: <what is wrong, one sentence>
```

## Batches

Generated from `design/backlog.json`: only icons not yet drawn.

### Batch 1: Interface (2)

```text
- help (interface): circle with ?
- alert (interface): triangle with !
```

### Batch 2: Status (12)

```text
- proof-confirmed (status): circle with a double check
- pattern-confirmed (status): circle with a dashed check
- plausible (status): circle with a tilde
- refuted (status): circle with a slash
- triaged-out (status): funnel with an x
- gate-pass (status): gate open with a check
- gate-blocked (status): gate closed with an x
- healthy (status): heart-free: pulse line with a check
- degraded (status): pulse line with a dip
- offline (status): dot with a slash
- warming-up (status): thermometer with a spark
- queued (status): hourglass
```

### Batch 3: Security (15)

```text
- shield-plausible (security): shield with a question mark
- shield-triaged (security): shield with a filter funnel
- proof-script (security): scroll with a play triangle
- finding (security): magnifier with an exclamation
- finding-blocker (security): octagon with an exclamation
- secret (security): key with an asterisk
- secret-masked (security): key with dots replacing the bit
- secret-history (security): key with a clock
- api-key-scoped (security): key with a bracket around its tip
- rotate-key (security): key inside a circular arrow
- ssrf (security): arrow bouncing off a server towards a house
- injection (security): syringe-free: text caret entering brackets
- xss (security): angle brackets with a lightning bolt
- path-traversal (security): folder with ../ steps
- sarif (security): document with a shield corner
```

### Batch 4: Security (10)

```text
- policy (security): scroll with a gavel-free check list
- permission-tier (security): stacked bars with a lock on the top one
- no-network (security): globe with a slash
- egress-blocked (security): arrow leaving a box stopped by a wall
- read-only (security): document with a lock and no pencil
- cap-drop (security): badge with a minus
- threat-model (security): target with an eye
- pentest (security): crosshair over a window
- soc2 (security): checklist with a shield
- csp (security): browser window with a shield
```

### Batch 5: Agents & AI (15)

```text
- subagent (agents): a large spark with a smaller spark branching off
- prompt (agents): chevron with a text line, inside a speech bubble
- tool-result (agents): document with a return-arrow
- memory (agents): brain-free: stacked cards with a bookmark
- model-select (agents): chip with a chevron-down
- model-download (agents): chip with a down-arrow
- eval-bench (agents): bar chart with a check on the tallest bar
- regression (agents): line chart dipping with an alert dot
- hallucination (agents): speech bubble with a dashed outline and question
- fake-completion (agents): check mark crossed through: claimed done, not done
- stall (agents): hourglass inside a speech bubble
- self-improve (agents): spark with an upward arrow looping back
- mcp-server (agents): plug connecting to a stack
- mcp-trust (agents): plug with a fingerprint arc
- checkpoint (agents): flag on a timeline dot
```

### Batch 6: Agents & AI (7)

```text
- rewind (agents): timeline with a back arrow to a dot
- skill (agents): puzzle-piece-free: a lightning bolt on a card
- persona (agents): mask outline with a spark
- reasoning (agents): three dots becoming a path
- token-budget (agents): coin stack with a gauge
- streaming (agents): lines flowing out of a bubble
- offline-mode (agents): cloud with a slash and a small chip
```

### Batch 7: Provenance & audit (9)

```text
- prev-hash (provenance): block with a back-pointing arrow
- verify-signature (provenance): seal with a check
- tamper (provenance): seal with a crack
- tamper-evident (provenance): seal with an eye
- timestamp (provenance): clock with a stamp base
- transparency-log (provenance): scroll with a magnifier
- attestation (provenance): certificate with a ribbon
- append-only (provenance): list with a plus at the bottom and a lock
- replay (provenance): two identical records with an x
```

### Batch 8: Infrastructure (15)

```text
- cluster (infrastructure): three connected nodes in a hexagon
- node (infrastructure): single hexagon with a dot
- raspberry-pi (infrastructure): small board with pins and a berry-free circle
- gpu-claim (infrastructure): gpu with a hand-free grab arrow
- container (infrastructure): stacked box with a door
- container-image (infrastructure): box with a layered stack
- registry (infrastructure): shelf of boxes
- ingress (infrastructure): arrow entering a gateway arch
- load-balancer (infrastructure): one arrow splitting into three
- helm-chart (infrastructure): ship-wheel-free: chart document with a cog
- pod (infrastructure): capsule with two dots
- namespace (infrastructure): dashed frame around dots
- deploy (infrastructure): rocket-free: box moving along an arrow
- rollback (infrastructure): box with a back arrow
- self-healing (infrastructure): cog with a plus
```

### Batch 9: Infrastructure (12)

```text
- reconciler (infrastructure): two arrows forming a circle around a dot
- vm-boot (infrastructure): power symbol inside a cube
- gateway (infrastructure): arch with an arrow through it
- dns (infrastructure): globe with a list
- tls (infrastructure): padlock with a globe
- tunnel (infrastructure): arch with dashes through it
- air-gap (infrastructure): two boxes with a gap and a slash
- on-prem (infrastructure): building with a server
- edge-cache (infrastructure): lightning over a cylinder
- metrics (infrastructure): gauge
- logs (infrastructure): stacked lines with timestamps
- trace (infrastructure): dots joined by a path
```

### Batch 10: Development (15)

```text
- code-review (development): magnifier over angle brackets
- diff (development): plus and minus lines side by side
- branch-review (development): git branch with an eye
- pull-request-draft (development): PR arrows with a dashed node
- commit-signed (development): commit dot with a seal
- merge-safe (development): merge arrows with a check
- build (development): hammer over a box
- build-failed (development): box with an x
- package (development): box with a tag
- package-publish (development): box with an up-arrow
- dependency-tree (development): package with branching lines
- lockfile (development): document with a padlock
- debugger (development): bug-free: breakpoint dot on a code line
- breakpoint (development): filled dot on a margin line
- extension-host (development): window with a puzzle-free plug socket
```

### Batch 11: Development (8)

```text
- language-server (development): brackets with a signal wave
- terminal-split (development): terminal window split in two
- pty (development): terminal with a cable
- ide-window (development): window with sidebar and editor panes
- hot-reload (development): lightning with a circular arrow
- feature-flag (development): flag with a toggle
- changelog (development): document with a clock
- release-tag (development): tag with a version dot
```

### Batch 12: Data (14)

```text
- document-ingest (data): document entering a funnel
- chunking (data): document cut into three strips
- embedding (data): document turning into dots
- retrieval (data): magnifier over a cylinder
- rag (data): book with a spark
- queue (data): three boxes in a row with an arrow
- worker (data): cog with a list
- pipeline (data): three connected pipes
- bulk-import (data): stack with an up-arrow
- s3-bucket (data): bucket
- object-storage (data): cube with a label
- mongo-collection (data): leaf-free: stacked documents in a cylinder
- schema (data): table with a key column
- sync (data): two cylinders with arrows
```

### Batch 13: Evidence & video (15)

```text
- exhibit (evidence): label tag with a number
- exhibit-sticker (evidence): round sticker with a letter
- case-file (evidence): folder with a badge
- chain-of-custody (evidence): hand-to-hand arrow with a seal
- footage (evidence): film strip
- frame-extract (evidence): film strip with one frame pulled out
- timeline-scrub (evidence): timeline with a playhead
- codec (evidence): film strip with angle brackets
- proprietary-format (evidence): film strip with a lock
- player-missing (evidence): play button with a question mark
- export-video (evidence): film strip with an up-arrow
- redact (evidence): rectangle over lines
- blur-face (evidence): face outline with a grid
- worksheet (evidence): clipboard with a table
- recovery (evidence): hard drive with a circular arrow
```

### Batch 14: Evidence & video (7)

```text
- hard-drive (evidence): hard drive
- dme (evidence): DVR box with a download
- body-cam (evidence): small camera with a clip
- dash-cam (evidence): camera on a windshield line
- cctv (evidence): wall camera
- hash-verify (evidence): file with a fingerprint and check
- court (evidence): columns with a pediment
```

### Batch 15: Voice & audio (9)

```text
- speech-to-text (voice): waveform becoming lines
- text-to-speech (voice): lines becoming a waveform
- voice-profile (voice): person with a waveform
- microphone-studio (voice): studio mic with a stand
- reference-audio (voice): waveform with a bookmark
- narration (voice): speech bubble with a waveform
- mixer (voice): three sliders
- mute-voice (voice): waveform with a slash
- kokoro (voice): waveform with a flower-free spark
```

### Batch 16: Documents & reports (10)

```text
- report (documents): document with a chart
- report-html (documents): document with angle brackets
- report-md (documents): document with a hash
- coverage (documents): document with a pie
- confidence (documents): gauge on a document
- fix-plan (documents): checklist with a wrench
- certificate (documents): document with a ribbon seal
- form (documents): document with input boxes
- export (documents): document with an up-right arrow
- pdf (documents): document with a curly corner
```

### Batch 17: People (5)

```text
- admin (people): person with a shield
- role (people): person with a badge
- sso (people): key with a person
- org (people): building
- tenant (people): building with a door key
```

### Batch 18: Recreation (8)

```text
- bowling-ball (recreation): ball with three finger holes
- strike (recreation): pins falling with an x
- spare (recreation): pins with a slash
- scoreboard (recreation): grid with frames
- league (recreation): trophy
- lane (recreation): lane with arrows
- pin-setter (recreation): row of pins
- team-standings (recreation): podium
```

### Batch 19: Burtson Labs (4)

```text
- bandit (brand): the Bandit mark: masked face, house style
- bandit-stealth (brand): mask with an editor window
- sentinel (brand): watchtower eye with a shield
- forge (brand): anvil with a chain link
```

### Refinement

```text
Redraw these existing icons; they read weaker than the rest at 16px:
- ear-off: ear shape is hard to recognise
- hand-heart: too many strokes
- cable: plug ends read as blobs
- key-round: bow and bit are unbalanced
```

## Moodboard prompt (optional, image model)

For exploring a direction before drafting SVG, for a brand mark for example. Use it for ideas only, never trace the output.

```text
A sheet of 12 minimalist line icons on a white background, uniform 2px rounded strokes on a 24px
grid, no fills, no gradients, generous spacing, consistent optical size. Subject: <concepts>.
Style: precise, calm, technical; rounded corners; one idea per icon; no text.
```
