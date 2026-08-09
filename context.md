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
