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
- Results gained `#baselines` (LIBERO-10 vs. 5 baselines), `#breadth` (LIBERO suites + RoboTwin),
  `#latency` (headline numbers + full profile in a `<details>`), and the method-positioning table.
- **Method restructured to two components** (Q-function, self-improvement loop). The rebuttal demotes
  the proposal distribution to "a design choice, not a core part of our work", so the standalone
  "Temporal-smoothed MPPI planner" subsection and the `traj_diversity.png` figure were removed; what
  survives is a short action-selection paragraph, the Q-weighted-average equation, and a callout
  noting MPPI (paper) vs 3-step diffusion draws (real robot). The old TL;DR bullet on MPPI planning
  was dropped for the same reason. `assets/traj_diversity.png` is still on disk, just unreferenced.
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

Different from the sim `rollout-compare` block above it. A **single virtual clock** (`syncGroup`)
drives all five clips: each RAF tick computes `elapsed` and pulls any clip that has drifted more than
0.35 s back onto the shared timeline, then restarts the whole group after the longest clip plus a
1.4 s hold. The earlier master-video approach let a stalled clip drift out of lockstep, which broke
the entire point of the section (comparing which rollout finishes first).

Status rings are CSS overlays, not baked into the video: **amber** while the rollout runs, **green**
once `currentTime >= successAt`, **red** for a failed episode (`successAt: null`). In-progress is
amber rather than red so a failing rollout and a running one can be told apart side by side — which
is the entire point of the `#recovery` section. The matching dot on the curve turns green at the same
moment, tying the videos to the plot.

**Performance:** an IntersectionObserver pauses every clip in a section that is off screen and the
RAF status loop skips it, so at most one section decodes at a time (5 clips, or 2 in `#recovery`).
Without this the page ran 15 simultaneous decodes and felt sluggish.

### Wording

Prose in the new sections is taken or condensed from `rebuttal_template.tex` and the paper's own
sentences rather than freshly written — e.g. the `#recovery` lede is the paper's actual argument for
why an off-policy Q can use failures, and the latency paragraph tracks the rebuttal's phrasing. Keep
it that way when editing: this page is author-voice, not a summary of the work.

Note for JS-injected captions: KaTeX auto-render runs once at load, so `$...$` in strings built by
`main.js` will not typeset. Use `<em>Q</em>` instead.

### Chart design

All three line charts label each series **directly beneath its own line** — no legend, and no
percentages repeated in the label, since the axis carries the values. Placement anchors on the last
point still on the axis, then walks backwards along the line until the label clears every one
already placed, trying **below the line first and then above it**, and clamping to the plot edges.
A fixed stagger is not enough: LIBERO-Goal, -Object and -Spatial all sit within ~1.5pp and collided
until the check became a real box test with both sides available. Labels also carry a white halo
(`paint-order: stroke fill`) so they stay legible where they must cross another series — with three
saturated suites there is no placement that avoids every line.

Charts render at **1:1 CSS pixels** — `responsiveSVG()` measures the container and draws at that
width so the SVG coordinate system *is* pixels. A fixed `viewBox` scaled all text with the container
(a 13px label became ~9px on a narrow window), which is why figure text must not be sized inside a
scaled viewBox. Font sizes therefore mean what they say: ticks/values 16px, series labels 17px,
against 17px body copy. They re-render on resize via `ResizeObserver`, and fall back to a legend
below the chart under 560px wide. Note these use class `.lc-svg`, **not** `.chart-svg` — the latter
forces `width: 100%`, which would rescale the text again.

Both line charts use **direct end-of-line labels** (`Q-Planning 99%`) instead of a legend, so plateau
gaps are readable without tracing colours; `deoverlapLabels()` pushes them apart and keeps the stack
inside the plot. The baselines chart uses `scale: 'log-error'` — a log axis on the *distance from 100%*, not on the
success rate. A plain log on success (`scale: 'log'`, also implemented) is the wrong transform for a
saturating metric: it crushes 91–99% into a single band at the top, the exact region the chart exists
to resolve. On log-error, 99 vs 95 occupies ~37% of the plot height while DSRL's swings stay visible
and IBRL still exits the axis. `scale: 'linear'` is the default for the breadth chart. (`build()` still supports
`cfg.panels` for stacked panels sharing one x-axis if that's ever wanted again.) Series that drop below a panel's floor exit the plot rather than running
flat along it. Both results charts carry `bleed` so they extend past the 760px text column.

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

### Results section structure

Restructured to remove duplication: **Benchmark results** (one table, all five benchmarks, offline
*and* online), **Online self-improvement on LIBERO-10** (baselines chart + positioning table + the
sim rollout videos), **Breadth**, **Latency**, **Q-value trajectories**.

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

### Known open items

- The three stack-cups failure-mode labels in `real_world.json` were proposed from watching the clips
  and need author confirmation.
- `cups_iter3` has `successAt: 6.35` — the measured value was 6.5 s but that clip is only 6.40 s long
  (it carries a 1 s start trim), so the value is clamped to land inside the clip.
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
