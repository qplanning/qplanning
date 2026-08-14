# Q-Planning project page — context dump

Purpose of this document: give a future collaborator (or the same person on a fresh session) enough context to pick up where the last iteration left off — what's on the site, what design choices were made and why, where the source assets live, what's deliberately missing, and how to change things safely.

## 1. Overview

This repo hosts the project page for the CoRL 2026 paper **"Beyond Imitation: Self-Improving Robot Policies via Off-Policy Q-Planning"** (short name **Q-Planning**). It is a single static page — no framework, no build step — served by GitHub Pages from the `master` branch root.

- Live URL: `https://qplanning.github.io/qplanning/`
- Repo: `git@github-qplanning:qplanning/qplanning.git` (SSH host alias defined in `~/.ssh/config` → `IdentityFile ~/.ssh/id_ed25519_qplanning`)
- Code repo referenced from the site's "Code" buttons: `https://github.com/qplanning/lerobot`
- Reference / stylistic inspiration: `https://research.nvidia.com/labs/gear/robottt/`

The submission is currently anonymous (reviewing at CoRL 2026), so the site shows "Anonymous Authors" and a placeholder BibTeX entry. De-anonymise both once the review period closes.

## 2. File layout

```
index.html                         one page, all sections
css/style.css                      ~500 lines, hand-written, no framework
js/main.js                         copy-BibTeX, nav highlight, video sync, chart render + hover
assets/
  teaser.png                       Figure 1, converted from LaTeX PDF
  traj_diversity.png               Figure 2
  q_over_time.png                  Figure 3
  self_improvement.png             Figure 4
  architecture.svg                 Figure 5, hand-authored SVG (see §5)
  paper.pdf                        Bundled copy of the CoRL PDF (Paper button target)
  videos/bowl_iter{0..5}.mp4       6 rollout videos, 224x224 @ 80 fps
.nojekyll                          Disables Jekyll on GitHub Pages
_CoRL_2026__Q_Planning.pdf         Original PDF at repo root (source of truth)
_CoRL_2026__Q_Planning.zip         Original LaTeX source zip (source of truth)
context.md                         This document
```

The two `_CoRL_...` files at the repo root are the authoritative artifacts; `assets/paper.pdf` is a copy so the download URL is portable (no underscore prefix, no naming leak on the public site).

## 3. Page structure

> **Stale below.** Sections 3–12 describe the page as first built, before the rebuttal update.
> They are kept for the reasoning, not as a map of the current file. Where they disagree with
> **"Rebuttal update"** further down, that section wins — in particular the page no longer has a
> planner subsection, no longer mentions MPPI anywhere, and the LIBERO-10 rollout comparison is now
> an iteration strip inside Results rather than a standalone `rollout-block` with a slider.

Order top to bottom:

1. **Sticky top nav** — title + Paper button (`assets/paper.pdf`) + Code button (`https://github.com/qplanning/lerobot`).
2. **Hero** — full title, "Anonymous Authors · Under review at CoRL 2026", buttons (Paper / Code / BibTeX anchor).
3. **Teaser figure** — `assets/teaser.png` with a Figure-1-style caption.
4. **Abstract** — verbatim from `main.tex` line 84.
5. **TL;DR** — 3 bullets that mirror the paper's contributions list.
6. **Rollout comparison** (no heading, no section wrapper — just a `<div class="rollout-block">`): side-by-side video pair on `put_black_bowl_in_bottom_drawer_and_close` (LIBERO-10). Details in §6.
7. **Method** — three subsections:
   - Off-policy Q-function over action chunks → `assets/architecture.svg` + HL-Gauss expectation equation (KaTeX display math).
   - Temporal-smoothed MPPI planner → `assets/traj_diversity.png` + MPPI weight/mean update (KaTeX).
   - Self-improvement loop → paper-style pseudocode block (see §7).
8. **Results** — intro paragraph, interactive bar chart, 7-column table, `self_improvement.png`, `q_over_time.png`. Details in §8.
9. **Limitations** — 2 sentences condensed from §6 of the paper.
10. **BibTeX** — placeholder entry with copy-to-clipboard button.
11. **Footer** — back-to-top link.

Left sidebar TOC (below the top nav) lists: Abstract, TL;DR, Method (with 3 sub-anchors), Results, Limitations, BibTeX. Sticky on desktop; collapses to a horizontal pill nav below 960 px.

## 4. Design system

- **Typography**: serif body `Charter, 'Source Serif Pro', Georgia`; sans headings/nav `Inter, -apple-system`; mono `SF Mono, Menlo` for code/algorithm keywords, line numbers, tokens.
- **Color tokens** in `:root`:
  - `--ink #1a1a1a`, `--muted #6a6a6a`, `--border #e5e5e7`
  - `--bg #ffffff`, `--bg-alt #fafafa`
  - `--accent #4338ca` (indigo — chosen deliberately to differ from the reference site's green), `--accent-tint #eef2ff`, `--accent-hover #3730a3`
- **Layout tokens**: `--content-w 760px`, `--wide-w 1200px`, `--sidebar-w 220px`, `--sidebar-gap 48px`, `--nav-h 56px`.
- **Responsive breakpoints**: 960 px (sidebar → pill nav) and 720 px (tighter padding, stack video pair).
- **Equations**: KaTeX 0.16.11 via CDN with `auto-render` for `$...$` inline and `$$...$$` display, wired in `<head>`.

## 5. Assets pipeline

Figures were extracted from the LaTeX submission zip and rendered once, then committed as PNG/SVG.

- `_CoRL_2026__Q_Planning.zip` was extracted to `/tmp/qplanning_extract/` (out-of-repo). The PDFs it contains live at `corl_2026_template_submission/img/`.
- Convert PDF figures to PNG (200 DPI) using either tool as appropriate:
  - `pdftoppm -r 200 -png <in.pdf> <out-stem>` — works for single-page PDFs.
  - `pdftocairo -png -f 1 -l 1 -singlefile -r 200 -cropbox <in.pdf> <out-stem>` — **required** for `qplanning_teaser-crop.pdf`, which has an odd 12-page structure where only page 1 is the actual cropped teaser and needs the CropBox honoured.
- `assets/architecture.svg` is not derived from the LaTeX. It is hand-authored to mirror Figure 5 (DinoV2 + T5 → transformer decoder → HL-Gauss head → Q_φ). Labels for `z_vis`, `z_txt`, and "query tokens" are deliberately offset off the arrow paths and given small white background rects to stay legible on top of the flow lines.
- To preview any SVG locally: `rsvg-convert -w 900 assets/architecture.svg -o /tmp/arch_preview.png`.

## 6. Rollout comparison videos

Located at `assets/videos/bowl_iter{0..5}.mp4`. All 224×224 @ 80 fps.

| iter | frames | steps shown | badge |
|------|--------|-------------|-------|
| 0 | 520 | 520 | ✗ failure |
| 1 | 520 | 518 | ✓ success |
| 2 | 343 | 343 | ✓ success |
| 3 | 317 | 317 | ✓ success |
| 4 | 254 | 254 | ✓ success |
| 5 | 218 | 218 | ✓ success |

Notes:
- iter1 shows **518** in the caption even though the video has 520 frames — that's the actual episode length the user wants displayed. Don't "correct" the video-frame-count to the caption automatically.
- iter0 is a failure — the frozen offline Q-function runs out its budget without completing the task. Both the badge (`badge-failure`) and the caption prose reflect this.
- Iterations 1..5 are shown as successes. If any turn out to be failures on closer inspection, flip both the `data-videos` JSON entry (`"success": false`) and the badge — the JS keys off the JSON.

Layout: left slot is fixed at iter0; right slot cycles iter1..iter5 based on a `<input type="range" min="1" max="5">` slider. All 6 videos are loaded together as separate `<video>` elements, `muted` + `autoplay` + `playsinline` + `preload="auto"` + no native controls (`disablepictureinpicture`, `controlslist="nodownload nofullscreen noremoteplayback"`, and CSS `pointer-events: none` on the elements to block right-click context menu).

**Master-clock sync** (in `js/main.js`): iter0 is the longest video (6.5 s) and is set to `loop`. The other 5 have `loop=false`. On every `timeupdate` from iter0, JS watches for a `currentTime` that jumps backward (loop wrap) — when that happens, it seeks every other video to 0 and calls `play()`. Result: all six videos start together at t=0 every 6.5 s. The faster clips (iter2..5) finish and freeze on their final frame until the next wrap, which visually makes the improvement obvious. There is also a `visibilitychange` listener that pauses everything when the tab hides to avoid drift.

## 7. Algorithm pseudocode block

Rendered as a `<figure class="algorithm">` with:
- Top and bottom 2-px horizontal rules (paper-style), header row above the body.
- Ordered list with auto-incremented line numbers via a CSS counter on `::before`.
- Indent classes `.ind-1`, `.ind-2`, `.ind-3` for nested loops (padding-left offsets).
- `.kw` for `for` / `while` / `end for` / etc — bold sans.
- `.cmt` for comments — italic muted.
- KaTeX-rendered math for symbols (`$\mathcal{D}$`, `$\phi$`, `$\bar{\mathbf{a}}^{(T)}_{t:t+H}$`, etc).
- `text-align: left` explicitly set on `.algorithm` to override the global `figure { text-align: center }` rule — otherwise the pseudocode would center-align, which reads wrong.

The block mirrors Algorithm 1 of the paper but uses inline gradient-step and EMA update notation directly rather than the paper's `L(φ) (Eq. 2)` reference, because the page renders the loss inline elsewhere and forward-refs to equation numbers would be confusing on a single-page layout.

## 8. Results section

- **Interactive bar chart** (`js/main.js` → `buildPanel`): two side-by-side SVG panels (Success rate, Episode length) — each with 3 grouped bars (FastWAM gray `#9ca3af`, Q-Planning offline light indigo `#a5b4fc`, Q-Planning online full indigo `#4338ca`). Values always shown above bars.
- Hover: bar darkens to its `hover` color, a dark tooltip appears at the cursor with the formatted value, and the matching cell in the results table gets an indigo outline via a `highlight` class. Tooltip position is recalculated on `mousemove` and clamped to the viewport. Click also triggers the same interaction for touch devices.
- **Table**: 7 columns (Benchmark + 2 sub-columns each for FastWAM / Q-Planning offline / Q-Planning online). Online column pair is tinted a darker shade (`#dee1fb`). Every cell in the LIBERO-10 row has an ID of the form `cell-libero10-{method}-{metric}` (methods: `fastwam`, `qplan-offline`, `qplan-online`; metrics: `success`, `eplen`) — the bar's `data-cell` attribute points at these IDs.
- The chart deliberately compares on **LIBERO-10 only**, because that's the only benchmark where all three methods have data — the paper only ran online self-improvement on LIBERO-10. The chart is labelled explicitly with "on LIBERO-10" to avoid implying a cross-benchmark mean. If ever the online experiment is repeated on other suites, the chart data lives in a single `values` object at the top of the chart-rendering block in `js/main.js` — replace values and add benchmarks there.
- The wider online results (LIBERO-Spatial, Object, Goal, RoboTwin) are `—` in the table because they were not run per the paper.

## 9. Interactivity summary (`js/main.js`)

Everything is vanilla JS in a single IIFE. No dependencies beyond KaTeX (loaded separately in `<head>`).

- **Copy BibTeX** — `navigator.clipboard.writeText` with a `document.execCommand` fallback, "Copied" label flashes for 1.5 s.
- **Active section highlight** — `IntersectionObserver` on all `.toc a` targets; highlights the topmost visible section as active.
- **Rollout video sync** — see §6.
- **Results bar chart** — inline SVG rendering + hover/click handlers + tooltip positioning.

If you add a new section to the page and want it in the sidebar, both add the `<a href="#...">` to the `.toc` list in `index.html` and give the target an `id` that matches — the JS auto-discovers them.

## 10. Deployment

- GitHub Pages: `Settings → Pages → Deploy from a branch → master → / (root)`.
- Build takes ~30-60 s after a push.
- `.nojekyll` at the repo root disables Jekyll processing entirely; this matters because Jekyll would ignore files/dirs starting with `_`, and both `_CoRL_2026__Q_Planning.pdf` and `_CoRL_2026__Q_Planning.zip` live there.
- `gh` CLI is authenticated against a *different* GitHub account, not `qplanning`. Attempts to hit `gh api repos/qplanning/qplanning` return 401. This means Pages can't be enabled programmatically from this workstation — do it via the web UI.

## 11. Local development

- One-liner: `python3 -m http.server 8000` from the repo root, then `http://localhost:8000/`.
- A background server has been running during recent sessions on port 8765 (task ID `bbd132i88` in the shell task manager). It may or may not still be alive by the time you read this — start a fresh one if needed.
- Verify KaTeX and interactivity by hand: math should render as typeset formulas, not `$...$` source; hovering a bar in the chart should outline the corresponding LIBERO-10 cell; the slider should swap the right-hand video with the left-hand video staying in sync.

## 12. Known open items (user has not asked to fix)

- **Author names + affiliations** — page currently reads "Anonymous Authors". Update the hero block in `index.html` when de-anonymized.
- **Real BibTeX entry** — replace the placeholder in `#bibtex-block` with the correct venue/DOI once known.
- **Favicon** — `index.html` references `assets/favicon.png` in `<link rel="icon">`, but the file does not exist. Either add a favicon or drop the link tag.
- **Per-task online rollout data** — none is in the shipped LaTeX zip, so the online column in the results table is `—` for every benchmark other than LIBERO-10. If per-task per-iteration data becomes available, extend the table + potentially add a benchmark selector to the bar chart.
- **arXiv link** — deliberately omitted from the hero per the initial spec. Add a button when a preprint URL exists.

## 13. Commit history so far

```
760f532 Left-align algorithm block
e4ac460 Paper-style algorithm pseudocode + iter1 step correction
3ad2b92 Mark iteration 0 rollout as a failure
b304ce8 Move rollout videos to after TL;DR and drop the heading
22fb0ea Point Code buttons at qplanning/lerobot repo
e88a3cf Add self-improvement rollout comparison after abstract
438b542 Initial commit: Q-Planning paper + project website
```

Each commit body captures the reasoning in a short paragraph; `git log --format=full` gives the full context if you need it.

---

## Rebuttal update (real-robot results + rollout videos)

Added after the CoRL rebuttal. The page now carries both the submitted-paper results and the
rebuttal's new material.

### New sections in `index.html`

- `#real-robot` — five-clip self-improvement strip (iterations 0–4) with a per-clip status ring and a
  success-rate curve underneath. Task toggle between insert-wallet and stack-cups.
  Deep-linkable: `?task=cups`.
- `#recovery` — one representative BC failure per named mode, shown beside the Q-Planning recovery
  on the same task. Chips switch mode. Deliberately one clip per mode, not a gallery: the real eval
  had few BC failures, and 15 decoding videos made the page lag.
- Results gained the per-iteration curves, `#latency` (headline numbers + full profile in a
  `<details>`), and the method-positioning table.
- **Method restructured to two components** (Q-function, self-improvement loop). The rebuttal demotes
  the proposal distribution to "a design choice, not a core part of our work", so the standalone
  planner subsection and the `traj_diversity.png` figure were removed; what survives is a short
  action-selection paragraph, the top-K Q-weighted-average equation, and a callout on where the
  candidates come from. The old TL;DR bullet on the planner was dropped for the same reason.
  `assets/traj_diversity.png` is still on disk, just unreferenced.
- **The planner is never named on the page.** Every mention of MPPI was removed by request: the
  method is stated as "sample N chunks from the frozen BC, score with Q, execute the Q-weighted
  average of the top K". The latency table rows that named it now read "Q-Planning, N=…" and
  "Iterative sampler ×N rounds (paper)". `assets/paper.pdf` still says MPPI throughout — that is the
  submitted PDF and is expected to differ. Do not reintroduce the term when editing.
- TL;DR now: Q-function, self-improvement loop, real robot. Limitations updated.

### Data

**All numbers live in `assets/data/real_world.json`** — curves, clip lists, failure-mode labels, and
the per-clip `successAt` times. Nothing is hardcoded in the JS. Source of truth is the rebuttal repo
(`_CoRL_2026__qplanning_rebuttal/`): `rebuttal_template.tex`, `data/*.csv`, `make_figs.py`,
`latency_profile.md`. Real-robot curves are truncated to iterations 0–4 (the rebuttal's step-1000
point is deliberately dropped so the five curve points line up with the five clips).

### Videos

`assets/videos/real/` — 15 clips + JPEG posters, 384×384 H.264 CRF 32, no audio, ~2.1 MB total.
(Was 27 clips at 512px/6.4 MB; reduced for page performance.)
Cut from the raw `.mov` captures in the parent directory at 1.5× speed with a warm-sand grade.
Clip↔iteration mapping: `bc_base` → iteration 0, `qplanning_iter_0..3` → iterations 1–4.

### How the video sync works (`js/main.js`)

A **single virtual clock** (`syncGroup`) drives every clip in a group: each RAF tick computes
`elapsed` and pulls any clip that has drifted more than 0.35 s back onto the shared timeline, then
restarts the whole group after the longest clip plus a 1.4 s hold. The earlier master-video approach
let a stalled clip drift out of lockstep, which broke the entire point of the section (comparing
which rollout finishes first). There are three groups — `si` (real robot), `cs` (recovery),
`l10` (LIBERO-10) — registered in the `GROUPS` map with the element each one's visibility is gated
on. `syncGroup(videos, groupKey)` takes the key, not a visibility predicate.

**Completion is latched, deliberately.** Chrome reclaims the decoder of a clip that has finished:
`readyState` drops 4 → 1 and `currentTime` resets to 0 while the element still reports unpaused.
Deriving `done` from `currentTime` each frame therefore un-flipped the green ring mid-cycle and sent
the step readout back to 0 — reproduced on 2 of the 6 LIBERO clips. `c._latched` is set once
`currentTime >= successAt` and cleared only by `kick()`, i.e. on the next cycle.

Two related traps, both fixed and both easy to reintroduce:
- **`play()` on a clip sitting at its end rewinds it to 0.** So `setSectionActive` no longer plays
  clips when a section scrolls back into view — it only resumes the group clock and lets the tick
  restart whatever still has time left — and the tick's play condition requires real time remaining
  on both the clock and the element.
- **`successAt` must be ≤ `duration − 0.06`.** Clips freeze at `duration − 0.05`, so a `successAt`
  above that never fires and the clip stays amber forever. `cups_iter3` (6.35 s against a 6.40 s
  clip) was exactly on the edge; the LIBERO `successAt` values are set a tenth short of the clip end
  for the same reason, and the readout prints the recorded `steps` when done rather than deriving it
  from the trigger time.

Status rings are CSS overlays, not baked into the video: **amber** while the rollout runs, **green**
once `currentTime >= successAt`, **red** for a failed episode (`successAt: null`). In-progress is
amber rather than red so a failing rollout and a running one can be told apart side by side — which
is the entire point of the `#recovery` section. The matching dot on the curve turns green at the same
moment, tying the videos to the plot.

**Performance:** an IntersectionObserver pauses every clip in a section that is off screen and the
RAF status loop skips it, so at most one group decodes at a time (5, 6 or 2 clips). Without this the
page ran 13+ simultaneous decodes and felt sluggish.

### Margin notes

Figure captions carry the claim only; definitions live in **margin notes** (`note(n, term, body)` in
`main.js`, rendered by the `.sn-*` styles). A marked term opens a note that sits in the empty
right-hand gutter when the window has ≥250px of it, and as a card under the marker when it does not.
Captions dropped from ~110 and ~95 words to ~45 and ~43.

Five notes, numbered **per figure** rather than down the page, since each one is read in place:
- every chart's **y-axis title** carries note ①, saying what a success rate counts and over how many
  evaluation seeds. This is why the y title is an HTML `.lc-ytitle` absolutely positioned over the
  figure rather than SVG `<text>`: SVG text cannot carry the note button or its styling. The figure
  is `position: relative` and the SVG is drawn at 1:1, so the title's `top` is just a plot
  coordinate.
- The title is placed **6px above the topmost tick label**, not at a fixed offset from the plot top.
  Those two coincide on a linear 0-100 axis but not on the log-error chart, where the first gridline
  sits ~74px below the plot top and a plot-top-anchored title read as stranded far above the numbers
  it labels.
- *SFT on successes* ② on the real-robot caption; *IBRL and DSRL are unstable* ② on the LIBERO-10
  chart's own figcaption.

**Only the curve is captioned in the LIBERO-10 figure.** The clip strip had a caption of its own,
but it sat *below the chart* — so a sentence about the videos read as if it described the axes. The
clips carry their own per-cell labels (iteration, live step count, ring colour), which is enough;
`#l10-caption` is gone and the caption now lives inside `figure#baselines-chart`. `#si-chart` is the
one chart with no figcaption — its caption is the paragraph below the stage — hence the explicit
`#si-chart { margin-bottom: 0 }` rather than a `.si-stage .si-chart` rule that would also have hit
the LIBERO chart.

`note()` keys its registry by body text, so the map does not grow each time a chart redraws on
resize or the task chip is switched (verified: 5 refs, 5 distinct ids, stable across redraws).

The marker is a **filled indigo numeral**, not a bare superscript, and this is the load-bearing
detail: on a phone there is no gutter, so the note is the *only* place that definition exists, and a
footnote nobody notices is worse than no footnote. The note body is also emitted into the button as
`.sr-only` text so assistive tech never depends on hover.

Behaviour, and the two traps already hit:
- Hover opens, click **pins** (so it survives the pointer leaving), click again or click away closes,
  Escape closes and returns focus to the marker. Keyboard activation arrives as a `click` on the
  `<button>`, so Enter/Space work with no extra handler.
- **No `focusin` handler.** Focus lands before `click` on a mouse press, so pinning on focus made the
  subsequent click read as a second tap and close the note immediately.
- **`hideSoon()` must not re-arm.** Clearing and re-setting the timer on every `pointerover` pushed
  the deadline forward for as long as the mouse kept moving, so the note never closed.

### Video encoding (why the clips are the way they are)

After a report that some viewers saw black frames, the clips were normalised. **Do not re-encode
back to the old settings.**

- All `assets/videos/real/*.mp4` were `yuvj420p` with `color_range=pc` — the deprecated full-range
  ("JPEG range") H.264 flavour that ffmpeg picks up from some sources. The sim clips, which nobody
  ever complained about, were plain `yuv420p`. They are now all
  `yuv420p` / `color_range=tv` / **Main** profile / level 3.1, converted with an explicit
  `scale=in_range=full:out_range=limited` so the picture is unchanged on a compliant player
  (SSIM 0.982 vs the originals, +4% size). Durations are bit-identical, which matters because every
  `successAt` is tied to them.
- **faststart everywhere.** The sim clips had their `moov` atom at the *end* of the file, so nothing
  could start playing until the whole file had downloaded — a stall that looks exactly like a black
  box on a slow connection. All clips now have `moov` before `mdat`.
- **`preload="metadata"`, not `"auto"`, in `mkClip`.** With `auto`, all 11 strip clips fetched in
  full on page load (~2.5 MB) and asked for a decoder up front. Mobile Safari caps how many video
  elements can hold a decoder at once, and past the cap the extras render black. `syncGroup` only
  needs `loadedmetadata`, which `metadata` still fires.
- **The two `#recovery` `<video>` elements carry a `poster` in the markup.** They get their `src`
  from JS, so before JS runs (or if it fails) they were empty boxes over `.video-frame`'s `#0f172a`
  background — indistinguishable from a black video. This is the same surface that produced the
  earlier stale-cache black-video report.

What was ruled out: the sources are not dark (first-frame Y ≈ 143/255 on every clip); Chrome decodes
and paints all of them (canvas pixel readback, mean 129-145); and so does AVFoundation, the stack
Safari uses (`qlmanage -t` thumbnails, mean 128-149).

### Wording

Prose in the new sections is taken or condensed from `rebuttal_template.tex` and the paper's own
sentences rather than freshly written — e.g. the `#recovery` lede is the paper's actual argument for
why an off-policy Q can use failures, and the latency paragraph tracks the rebuttal's phrasing. Keep
it that way when editing: this page is author-voice, not a summary of the work.

Note for JS-injected captions: KaTeX auto-render runs once at load, so `$...$` in strings built by
`main.js` will not typeset. Use `<em>Q</em>` instead.

### Chart design

**One renderer for every curve.** `makeChart(fig, cfg)` / `drawChart()` draws the real-robot curve,
the LIBERO-10 baselines curve and the breadth curve, so they share margins, tick typography, the
shaded band between a method and its closest baseline, direct labels and the hover readout. This was
a deliberate consolidation: the LIBERO figure used to be a different object from the real-robot one
(a left/right video pair on a slider, plus a legend-less multi-series chart) and read as a separate
design. Both self-improvement figures are now the same thing — a strip of one clip per iteration
over a curve whose markers turn green as the clips finish, wired both ways (hover a clip to mark its
point, hover the curve to mark the clip). `cfg` knobs: `band: ['qp','sft']`, `markers`,
`valueLabels: 'all' | 'ends'`, `plainMarkers`, `scale`, `panels`, `onHover`.

The two charts also share a palette so the eye carries meaning across them: **indigo** is always
Q-Planning, **grey dashed** is always SFT-on-successes (the band partner in both), and the remaining
LIBERO baselines are orange / green / cyan / pink. DAWR used to be `#4a3aa7`, near-identical to
Q-Planning's indigo, which made the two lines hard to separate once the band was added.

All three line charts label each series **directly beneath its own line** — no legend, and no
percentages repeated in the label, since the axis carries the values. Placement anchors on the last
point still on the axis, then walks backwards along the line until the label clears every one
already placed, trying **below the line first and then above it**, and clamping to the plot edges.
A fixed stagger is not enough: LIBERO-Goal, -Object and -Spatial all sit within ~1.5pp and collided
until the check became a real box test with both sides available. Labels also carry a white halo
(`paint-order: stroke fill`, 6.5px) so they stay legible where they must cross another series —
with three saturated suites there is no placement that avoids every line. A **filled backing rect**
was tried and removed: it hid the crossed line, but a white rectangle sitting on the shaded band and
the gridlines was far more conspicuous than the line it was covering. At 6.5px the outlines of
neighbouring letters merge, so a crossed line reads as interrupted by the word rather than struck
through it. Label boxes come from `getComputedTextLength()`, which is why the SVG is appended to the
figure *before* its contents are drawn: the method returns 0 on a detached element, and the old
character-count estimate was off by enough to misplace the collision test.

Charts render at **1:1 CSS pixels** — `responsiveSVG()` measures the container and draws at that
width so the SVG coordinate system *is* pixels. A fixed `viewBox` scaled all text with the container
(a 13px label became ~9px on a narrow window), which is why figure text must not be sized inside a
scaled viewBox. Font sizes therefore mean what they say: ticks/values 16px, series labels 17px,
against 17px body copy. They re-render on resize via `ResizeObserver`, and fall back to a legend
below the chart under 560px wide. Note these use class `.lc-svg`, **not** `.chart-svg` — the latter
forces `width: 100%`, which would rescale the text again.

The baselines chart uses `scale: 'log-error'` — a log axis on the *distance from 100%*, not on the
success rate. A plain log on success (`scale: 'log'`, also implemented) is the wrong transform for a
saturating metric: it crushes 91–99% into a single band at the top, the exact region the chart exists
to resolve. On log-error, 99 vs 95 occupies ~37% of the plot height while DSRL's swings stay visible
and IBRL still exits the axis. `scale: 'linear'` is the default for the breadth and real-robot charts. (`drawChart()` still supports
`cfg.panels` for stacked panels sharing one x-axis if that's ever wanted again.) Series that drop
below a panel's floor exit the plot rather than running flat along it.

**There is no bleed any more, and that is the point.** `main` used to be capped at 760px with wide
blocks pulled outward by negative margins, so section rules (the `h2` border) ended left of the
figures and each fix traded one misalignment for another. Now **everything shares `--content-w`
(870px)** — text, headings, rules, figures, video strips, charts. Nothing overhangs and nothing
hugs. Body type steps 17→18px at ≥1000px so the wider measure (~95 characters) still reads.

**Centring on wide screens.** At ≥1400px `.page` becomes a three-column grid
(`1fr | --content-w | 1fr`) so the content column is centred in the *viewport*, and the TOC sits
`justify-self: center` in the left gutter — further left than it would be if the sidebar+content
pair were centred as a unit. Centring the pair put the text noticeably right of centre, because the
TOC is narrow and mostly empty. Below 1400px there is not room for both (870 + 2×260 ≈ 1390), so it
falls back to the pair layout with `main` centred inside its own column, which keeps the block
close to balanced (measured 14px off centre at 1280).

The latency table shows **ms with a fits/over badge** against each benchmark's replanning budget,
replacing a bare "% budget" column — percentages of an unstated denominator (194%, 354%) did not
communicate anything on their own.

### Responsive

Verified with no horizontal overflow at 390 / 620 / 768 / 1024 / 1280 / 1440. The strip stays a
single row of five down to 560px (so the chart alignment holds on iPad portrait), then wraps to two
columns; the failure pair stacks at 640px; charts drop end labels for a legend under 560px.

Note when testing: **headless Chrome clamps `--window-size` to roughly 500px minimum**, so narrower
screenshots are the page rendered wide and cropped, which looks exactly like a broken layout. Test
phone widths through an iframe of an exact width instead — that is what the (now deleted) `diag.html`
harness did, and it is worth recreating rather than trusting a narrow `--screenshot`.

### Type scale

Body 17px, stepping to 18px at ≥1000px, with `h2` 27px and `h3` 21px there — a 18/21/27 ladder.
`h3` was 17px, i.e. *smaller* than body copy once body stepped up, which is what made stacked
subsections read as clutter. Subsection headings also carry `margin-top: 52px`; the air is what
separates them. `h2 + h3` and `.lede + h3` drop back to 28px so a section that opens on a
subsection has no dead gap.

### Chart hover vs. the axis-title note

The readout that follows the pointer across a curve had **no vertical bound** — it fired anywhere
over the SVG, including the band above the first gridline where the y-axis title and its note live,
and the card then painted straight over the control the reader was reaching for. Two fixes, both
load-bearing:
- `pointermove` now requires the pointer to be inside the plot body before showing anything.
- the card is anchored to the **hovered data point** instead of being parked at the plot top, where
  it also overhung the figure entirely on tall multi-series charts (it grows upward from its
  anchor). When there is not room above the point it **flips underneath** rather than stacking on
  the title.
- the clearance it must respect is computed from the title's *measured* bottom
  (`topLimit = titleBottom + 6`), so it stays correct as the title moves.

`.lc-ytitle` also carries `z-index: 3` so the title outranks `.lc-tip` if they ever do overlap.
Verified by sweeping the full width of the title row: 0 readout triggers, and the numeral is the
top-most element at its own centre.

### Framing of the baselines figure

The LIBERO-10 curve is **advertised as the comparison against other self-improvement methods**, not
as a LIBERO-10 result. The run-in lead is "Against other self-improvement methods"; LIBERO-10 is
named only as the venue the comparison happens to run on. An earlier draft opened it with
"LIBERO-10 is the hardest of the five", which is **false** — RoboTwin is the lowest benchmark on the
page (83.2 FastWAM / 83.8 offline, against LIBERO-10's 90.0 / 93.0). LIBERO-10 is the hardest
*LIBERO suite*, nothing more. Don't reintroduce the claim.

Two other accuracy fixes made in the same pass, both worth not undoing:
- "shorten episodes on all five" is only true **relative to iteration 0**. Against FastWAM, the
  online column is *longer* on LIBERO-Spatial (107 vs 106) and RoboTwin (232 vs 220).
- "lift every benchmark" was wrong for LIBERO-Goal, which is flat at 99.0 from iteration 0 to 10.
  The text now says success lifts "wherever there is headroom" and names the three that move.

**Known tension, left as the author chose.** The Abstract is verbatim from the submission and says
*six* iterations; every result on the page is the rebuttal's ten-iteration runs. The table note now
says so explicitly rather than leaving the reader to spot the contradiction. Likewise the real-robot
caption quotes the rebuttal's "25 → 80%" while the plotted curve ends at 85% (iteration 4) — both
verbatim from the rebuttal, per author instruction.

### Results section structure

Three subsections: **Benchmark results**, **Planning latency**, **Q-value trajectories**.

Benchmark results carries everything about the benchmarks, in one narrative: the five-benchmark
table (FastWAM | offline | online), then the breadth curve captioned as *the online column of the
table above, iteration by iteration*, then the LIBERO-10 clip strip and baselines curve as an
interactive figure with no heading of its own. The old `#breadth` subsection read as bolted on
because it was — it plotted the same benchmarks the table already listed — and LIBERO-10 did not
need to be a peer section of "Benchmarks" when it is one row of that table examined closely. The
`#baselines` anchor survives on the LIBERO-10 paragraph so the Method section's Best-of-N link still
resolves; `#breadth` is gone. TOC under Results is now just Benchmarks and Latency.

Removed: the LIBERO-10 bar-chart figure (it restated the table's LIBERO-10 row, and its ~220 lines of
JS are deleted along with `#chart-tooltip` and the `cell-libero10-*` ids it hovered), and
`self_improvement.png` (its success panel duplicates the baselines chart; episode length now lives in
the table). `assets/self_improvement.png` is still on disk, unreferenced.

The table's online column used to be em-dashes for everything but LIBERO-10, from when online was
LIBERO-10-only. It is now filled from the rebuttal's per-suite runs at iteration 10
(`libero_*_si.csv`, `robotwin_si.csv`, `libero10_si_loop.csv` @ step 2000): Spatial 98.5/107,
Object 100/120, Goal 99.0/99, LIBERO-10 99.0/224, RoboTwin 91.4/232, mean 97.6.

Two places the table deliberately follows the **rebuttal** rather than the paper:

- LIBERO-10 online is **99.0 / 224** (ten iterations) rather than the paper's 99 / 232 (six).
- RoboTwin offline is **83.8 / 279**, not the paper's Table 3 value of 88.0 / 231. The rebuttal's
  RoboTwin self-improvement run starts from 83.8 — its own text frames the result as
  "RoboTwin (83.8→91.4%)" — whereas for the other four suites iteration 0 coincides exactly with the
  paper's offline number. Using 88.0 next to the rebuttal's 91.4 would have implied a +3.4pp gain
  across two different models; 83.8→91.4 is +7.6pp on one.

Consequences of that second choice, both applied: the offline mean is **93.4** (not 94.2), and the
paper's "+4.8pp on RoboTwin" offline claim is dropped from the prose — against 83.8 the offline gain
over FastWAM is +0.6pp. The "+1.4pp on the LIBERO aggregate" claim is unaffected. **The RoboTwin
offline cell therefore disagrees with the published Table 3**; that is intentional, but re-check it
if the paper is ever updated.

### Asset cache busting

`index.html` loads `css/style.css?v=N` and `js/main.js?v=N`. **Bump N whenever either file
changes.** GitHub Pages serves everything with `Cache-Control: max-age=600`, and the edge can hand
out the two files with different ages, so a browser can pair a fresh `index.html` with a
ten-minute-stale `main.js`. That is not hypothetical: removing `#cs-mode-desc` from the markup while
a cached `main.js` still did `descEl.innerHTML = ...` threw inside `showMode`, the clip `src` was
never assigned, and the recovery videos rendered as empty black frames. It self-heals after ten
minutes, which makes it easy to misdiagnose as a deploy delay.

### Mobile viewport

`main` uses `width: 100%` + `justify-self: center`, **not** `margin-left/right: auto`. Auto margins
make a grid item shrink-to-fit, so it sizes to its own min-content: on a phone that pushed `main` to
804px inside a 390px viewport, `documentElement.scrollWidth` to 822, and iOS Safari opened the page
at roughly 2x zoom showing half the width. Auto margins looked fine on desktop because the track was
always wider than the content. The collapsed grid track is also `minmax(0, 1fr)` rather than `1fr`,
so it can shrink below its content's min-content width.

Check this the exact way: an iframe of a fixed width, comparing
`documentElement.scrollWidth` to `clientWidth`. A narrow `--window-size` cannot show it because
headless clamps the window to ~500px.

### Known open items

- The three stack-cups failure-mode labels in `real_world.json` were proposed from watching the clips
  and need author confirmation.
- `cups_iter3` has `successAt: 6.28` — the measured value was 6.5 s but that clip is only 6.40 s long
  (it carries a 1 s start trim), so the value is clamped to land inside the clip, and far enough
  inside to clear the `duration − 0.05` freeze point.
- The six LIBERO clips' `successAt` values are `steps / 80` less ~0.12 s, i.e. the trigger fires a
  breath before the clip's last frame. The readout still prints the exact recorded step count
  (520 / 518 / 343 / 317 / 254 / 218) once complete, so the early trigger is not visible.
- Real-robot iteration 4 for insert-wallet (85%) is flagged as a placeholder in the rebuttal's
  `make_figs.py`; the rebuttal prose quotes 25→80% (iteration 3). Both are on the page as-is per
  author instruction to reproduce the rebuttal verbatim.
- IBRL's plotted curve has no measured data behind it (`ibrl_success_rate` is NaN for every row in
  `libero10_si_loop.csv`); it is drawn from hardcoded values in `make_figs.py`. Reproduced verbatim
  per author instruction. The web chart lets the line exit the axis rather than running flat along
  the floor, so it does not misread as sitting at 65%.

### Local preview

`python3 -m http.server 8081` from this directory (port 8000 had a stale server from an earlier
session). The page needs to be served over HTTP — `real_world.json` is fetched, so `file://` will
leave the interactive sections empty (a message says so).
