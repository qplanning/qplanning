(() => {
  // ================= Copy BibTeX =================
  const btn = document.getElementById('copy-bibtex');
  const block = document.getElementById('bibtex-block');
  if (btn && block) {
    btn.addEventListener('click', async () => {
      const text = block.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const prev = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = prev;
        btn.classList.remove('copied');
      }, 1500);
    });
  }

  // ================= Active section highlight =================
  const links = Array.from(document.querySelectorAll('.toc a'));
  const sections = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const bySection = new Map(sections.map((s, i) => [s, links[i]]));
    const seen = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      });
      let top = null;
      let topY = Infinity;
      seen.forEach(s => {
        const y = s.getBoundingClientRect().top;
        if (y < topY) { topY = y; top = s; }
      });
      links.forEach(l => l.classList.remove('active'));
      if (top) {
        const link = bySection.get(top);
        if (link) link.classList.add('active');
      }
    }, {
      rootMargin: '-72px 0px -60% 0px',
      threshold: [0, 0.1, 0.5],
    });

    sections.forEach(s => observer.observe(s));
  }

  // ================= Rollout video comparison =================
  const rollout = document.querySelector('.rollout-compare');
  if (rollout) {
    const meta = (() => {
      try { return JSON.parse(rollout.getAttribute('data-videos')); }
      catch { return []; }
    })();
    const metaByIter = new Map(meta.map(m => [m.iter, m]));

    const master = document.getElementById('video-left');
    const rightVideos = Array.from(rollout.querySelectorAll('.video-right'));
    const slider = document.getElementById('iter-range');
    const iterLabel = document.getElementById('iter-slider-value');
    const metaIter = document.getElementById('meta-right-iter');
    const metaSteps = document.getElementById('meta-right-steps');
    const metaBadge = document.getElementById('meta-right-badge');

    // Only the master and the one selected right-hand clip ever decode. The
    // other four are hidden behind CSS visibility, so playing them was four
    // wasted decoders running for the whole session.
    let simVisible = true;
    let activeIter = 1;
    const activeRight = () => rightVideos.find(v => Number(v.dataset.iter) === activeIter);

    const playAll = () => {
      if (!simVisible) return;
      [master, activeRight()].forEach(v => {
        if (!v) return;
        v.muted = true;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      });
    };
    const pauseAll = () => [master, ...rightVideos].forEach(v => v.pause());

    if ('IntersectionObserver' in window) {
      const block = rollout.closest('.rollout-block') || rollout;
      new IntersectionObserver((entries) => {
        entries.forEach(e => {
          simVisible = e.isIntersecting;
          if (simVisible) playAll(); else pauseAll();
        });
      }, { rootMargin: '150px 0px' }).observe(block);
    }

    // ---- Master-driven sync ----
    // Master is the longest video (iter0). When it wraps back to the start,
    // reset every other video to 0 so they restart in lockstep. Shorter clips
    // simply run out and freeze on their last frame until the next wrap.
    master.loop = true;
    rightVideos.forEach(v => { v.loop = false; });

    let lastMasterT = 0;
    const resetAll = () => {
      // Rewind them all so a later selection starts from the right place, but
      // only resume playback on the visible one.
      rightVideos.forEach(v => { try { v.currentTime = 0; } catch {} });
      const a = activeRight();
      if (a && simVisible) {
        const p = a.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };

    master.addEventListener('timeupdate', () => {
      const t = master.currentTime;
      // Wrap detected: currentTime jumped backwards.
      if (t + 0.05 < lastMasterT) resetAll();
      lastMasterT = t;
    });

    // Some browsers fire `seeked` when a loop wraps; treat as wrap too.
    master.addEventListener('seeked', () => {
      if (master.currentTime < 0.1) resetAll();
    });

    // ---- Slider: pick which right-hand iteration is visible ----
    const setActiveIter = (iter) => {
      activeIter = iter;
      rightVideos.forEach(v => {
        const on = Number(v.dataset.iter) === iter;
        v.classList.toggle('is-active', on);
        if (on) {
          // catch the newly-shown clip up to the master's position, then play
          try { v.currentTime = Math.min(master.currentTime, Math.max(0, (v.duration || 0) - 0.05)); } catch {}
          if (simVisible) {
            const p = v.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        } else {
          v.pause();
        }
      });
      iterLabel.textContent = iter;
      metaIter.textContent = iter;
      const m = metaByIter.get(iter);
      if (m) {
        metaSteps.textContent = m.steps;
        metaBadge.classList.toggle('badge-success',  m.success);
        metaBadge.classList.toggle('badge-failure', !m.success);
        metaBadge.title = m.success ? 'Successful episode' : 'Failed episode';
        metaBadge.innerHTML = m.success ? '✓&nbsp;success' : '✗&nbsp;failure';
      }
    };
    setActiveIter(1);

    slider.addEventListener('input', (e) => {
      setActiveIter(Number(e.target.value));
    });

    // Start playback once the master's metadata is ready.
    if (master.readyState >= 1) playAll();
    else master.addEventListener('loadedmetadata', playAll, { once: true });

    // Pause/resume based on tab visibility to avoid runaway drift when hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        [master, ...rightVideos].forEach(v => v.pause());
      } else {
        playAll();
      }
    });
  }

  // ================= Real-robot sections =================
  // Data-driven: everything below reads assets/data/real_world.json so the
  // numbers live in exactly one place.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, text) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };
  const VID_DIR = 'assets/videos/real/';

  // Shared registry of clips whose status ring the RAF loop drives.
  const tracked = [];

  // One RAF loop for every tracked clip on the page.
  // Visibility gating. Decoding every clip on the page at once is what makes
  // this feel heavy, so each section only plays while it is actually on
  // screen; offscreen clips are paused and skipped by the status loop.
  let siVisible = true, csVisible = true;
  const setSectionActive = (which, on) => {
    if (which === 'si') siVisible = on; else csVisible = on;
    for (const c of tracked) {
      const mine = which === 'si' ? c.group === 'si' : c.group === 'cs';
      if (!mine) continue;
      if (on) {
        const p = c.video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        c.video.pause();
      }
    }
    if (which === 'si' && siClock) (on ? siClock.resume() : siClock.pause());
    schedule();
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const which = e.target.id === 'real-robot' ? 'si' : 'cs';
        setSectionActive(which, e.isIntersecting);
      });
    }, { rootMargin: '150px 0px' });
    ['real-robot', 'recovery'].forEach(id => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  let rafPending = false;
  const tickStatus = () => {
    if (siClock && siVisible) siClock.tick();
    for (const c of tracked) {
      if (c.group === 'si' && !siVisible) continue;
      if (c.group === 'cs' && !csVisible) continue;
      const t = c.video.currentTime || 0;
      const dur = c.video.duration || 0;
      const done = c.successAt != null && t >= c.successAt;

      // Every write below is guarded: this runs at 60fps across every clip, and
      // unconditional style/text writes here were causing layout on each frame.
      if (done !== c._done) {
        c._done = done;
        c.frame.classList.toggle('is-done', done);
        c.frame.classList.toggle('is-failed', c.successAt == null);
        if (c.timeEl) c.timeEl.classList.toggle('is-done', done);
        if (c.onStatus) c.onStatus(done);
      }
      if (c.bar) {
        const denom = c.successAt != null ? c.successAt : (dur || 1);
        const f = Math.min(1, t / denom);
        if (c._f === undefined || Math.abs(f - c._f) > 0.004) {
          c._f = f;
          // scaleX composites; animating width would relayout the frame.
          c.bar.style.transform = 'scaleX(' + f.toFixed(3) + ')';
        }
      }
      if (c.timeEl) {
        const label = done ? c.successAt.toFixed(1) + 's ✓' : t.toFixed(1) + 's';
        if (label !== c._label) { c._label = label; c.timeEl.textContent = label; }
      }
    }
    rafPending = false;
    schedule();
  };
  const schedule = () => {
    if (rafPending || document.hidden || !tracked.length) return;
    if (!siVisible && !csVisible) return;   // nothing on screen — stop the loop
    rafPending = true;
    requestAnimationFrame(tickStatus);
  };

  // Lockstep sync driven by one virtual clock rather than by any single
  // video's own clock. A clip that stalls on decode gets pulled back onto the
  // shared timeline instead of drifting, which matters here because the whole
  // point is comparing which rollout finishes first. Clips shorter than the
  // group freeze on their last frame; everything restarts together after a
  // short hold so the finish order stays readable.
  let siClock = null;
  const syncGroup = (videos, holdSec = 1.4) => {
    if (!videos.length) return null;
    videos.forEach(v => { v.muted = true; v.loop = false; });
    const g = { videos, t0: 0, span: 0, hold: holdSec, started: false, pausedAt: 0 };

    // Scrolling the section out of view pauses playback; hold the virtual
    // clock too, so coming back resumes mid-rollout instead of jumping.
    g.pause = () => { if (!g.pausedAt) g.pausedAt = performance.now(); };
    g.resume = () => {
      if (g.pausedAt) { g.t0 += performance.now() - g.pausedAt; g.pausedAt = 0; }
    };

    const kick = () => {
      g.span = videos.reduce((m, v) => Math.max(m, v.duration || 0), 0);
      g.t0 = performance.now();
      g.started = true;
      videos.forEach(v => {
        try { v.currentTime = 0; } catch {}
        // Only actually decode if the section is on screen — metadata can land
        // long after the visibility observer has already run.
        if (siVisible) {
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      });
      if (!siVisible) g.pause();
      schedule();
    };

    let ready = 0;
    videos.forEach(v => {
      const onMeta = () => { if (++ready === videos.length) kick(); };
      if (v.readyState >= 1) onMeta();
      else v.addEventListener('loadedmetadata', onMeta, { once: true });
    });

    g.tick = () => {
      if (!g.started) return;
      const elapsed = (performance.now() - g.t0) / 1000;
      if (elapsed > g.span + g.hold) { kick(); return; }
      for (const v of g.videos) {
        const dur = v.duration || 0;
        const target = Math.min(elapsed, Math.max(0, dur - 0.05));
        // Only correct real drift — seeking every frame would thrash decode.
        if (Math.abs((v.currentTime || 0) - target) > 0.35) {
          try { v.currentTime = target; } catch {}
        }
        if (siVisible && elapsed < dur && v.paused) {
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      }
    };
    return g;
  };

  const mkClip = (src, opts = {}) => {
    const fig = document.createElement('figure');
    fig.className = opts.cellClass || 'si-cell';
    const frame = document.createElement('div');
    frame.className = 'video-frame status-frame';
    const video = document.createElement('video');
    video.src = VID_DIR + src + '.mp4';
    video.poster = VID_DIR + src + '.jpg';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    const ring = document.createElement('span');
    ring.className = 'status-ring';
    ring.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.className = 'status-bar';
    bar.setAttribute('aria-hidden', 'true');
    frame.append(video, ring, bar);

    const cap = document.createElement('figcaption');
    cap.className = 'rollout-meta';
    const label = document.createElement('span');
    label.className = 'rollout-label';
    label.innerHTML = opts.label || '';
    cap.appendChild(label);
    let timeEl = null;
    if (opts.showTime) {
      timeEl = document.createElement('span');
      timeEl.className = 'si-time';
      cap.appendChild(timeEl);
    }
    fig.append(frame, cap);
    return { fig, frame, video, bar, timeEl };
  };

  const STRIP_GAP = 10;   // must match .si-strip gap

  // Draw at 1:1 CSS pixels. A fixed viewBox scales all text with the
  // container, so a 13px label became ~9px on a narrow window; here the
  // coordinate system *is* pixels, so font sizes match the body copy exactly.
  function miniLegend(items) {
    const el = document.createElement('div');
    el.className = 'chart-legend';
    items.forEach(it => {
      const sp = document.createElement('span');
      const i = document.createElement('i');
      i.style.borderTopColor = it.color;
      i.style.borderTopStyle = it.dash ? 'dashed' : 'solid';
      sp.append(i, document.createTextNode(it.label));
      el.appendChild(sp);
    });
    return el;
  }

  function responsiveSVG(fig, draw) {
    let lastW = 0;
    const render = () => {
      const w = Math.round(fig.clientWidth || fig.parentElement.clientWidth || 0);
      if (w < 80) { requestAnimationFrame(render); return; }   // not laid out yet
      if (Math.abs(w - lastW) < 8) return;
      lastW = w;
      draw(w);
    };
    render();
    if ('ResizeObserver' in window) {
      let pending = false;
      new ResizeObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => { pending = false; render(); });
      }).observe(fig);
    } else {
      window.addEventListener('resize', render);
    }
    return render;
  }

  fetch('assets/data/real_world.json')
    .then(r => r.json())
    .then(RW => { initSelfImprovement(RW); initFailureModes(RW); initLineCharts(RW); })
    .catch(() => {
      // Served from file:// or the JSON is missing — leave the static markup be.
      const s = document.getElementById('si-caption');
      if (s) s.textContent = 'Interactive rollouts require the page to be served over HTTP.';
    });

  // ---------- (1) real-robot self-improvement strip ----------
  function initSelfImprovement(RW) {
    const strip = document.getElementById('si-strip');
    const chartFig = document.getElementById('si-chart');
    const capEl = document.getElementById('si-caption');
    if (!strip) return;

    let cells = [];
    let dots = [];

    const render = (taskKey) => {
      const task = RW.tasks[taskKey];
      // drop previously tracked clips
      for (let i = tracked.length - 1; i >= 0; i--) {
        if (tracked[i].group === 'si') tracked.splice(i, 1);
      }
      strip.innerHTML = '';
      cells = [];

      task.clips.forEach((c, idx) => {
        const isBase = c.iter === 0;
        const clip = mkClip(c.src, {
          label: isBase
            ? '<span class="si-iter">Iteration&nbsp;0</span><br/>frozen BC'
            : '<span class="si-iter">Iteration&nbsp;' + c.iter + '</span>',
          showTime: true,
        });
        if (isBase) clip.fig.classList.add('is-baseline');
        strip.appendChild(clip.fig);
        const rec = {
          video: clip.video, frame: clip.frame, bar: clip.bar,
          timeEl: clip.timeEl, successAt: c.successAt, group: 'si',
          onStatus: (done) => {
            const d = dots[idx];
            if (d) d.setAttribute('fill', done ? '#22c55e' : '#4338ca');
          },
        };
        tracked.push(rec);
        cells.push({ clip, iter: c.iter, idx });

        clip.fig.addEventListener('mouseenter', () => highlight(idx, true));
        clip.fig.addEventListener('mouseleave', () => highlight(idx, false));
      });

      siClock = syncGroup(cells.map(c => c.clip.video));
      drawCurve(taskKey);

      capEl.innerHTML =
        '<strong>' + task.label + ': ' + task.headline + ' over five iterations.</strong> ' +
        task.blurb +
        // No KaTeX delimiters here: auto-render already ran before this is injected.
        ' Each iteration fine-tunes only <em>Q</em> on 20 episodes; the BC policy is never updated. ' +
        'Clips restart together and turn green on task completion, so the order they turn green is ' +
        'the order they finished.';
    };

    const highlight = (idx, on) => {
      const d = dots[idx];
      if (d) d.setAttribute('r', on ? 7 : 4.5);
    };

    // Place labels at their ideal y, then push apart so none overlap.
    function deoverlap(items, minGap) {
      items.sort((a, b) => a.y - b.y);
      for (let i = 1; i < items.length; i++) {
        if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
      }
      return items;
    }

    function drawCurve(taskKey) {
      responsiveSVG(chartFig, (W) => drawCurveAt(taskKey, W));
    }

    function drawCurveAt(taskKey, W) {
      const task = RW.tasks[taskKey];
      const H = 346, mL = 58, mR = 58, mT = 40, mB = 54;
      const pw = W - mL - mR, ph = H - mT - mB;
      const its = RW.iterations;
      const x = i => mL + (pw * i) / (its.length - 1);
      const y = v => mT + ph * (1 - v / 100);

      const svg = svgEl('svg', {
        width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'lc-svg', role: 'img',
        'aria-label': 'Success rate against self-improvement iteration for ' + task.label,
      });

      for (const t of [0, 20, 40, 60, 80, 100]) {
        svg.appendChild(svgEl('line', { x1: mL, x2: mL + pw, y1: y(t), y2: y(t), class: 'chart-grid' }));
        svg.appendChild(svgEl('text', { x: mL - 10, y: y(t) + 5, class: 'lc-tick', 'text-anchor': 'end' }, t + '%'));
      }
      its.forEach(i => {
        svg.appendChild(svgEl('text', {
          x: x(i), y: mT + ph + 24, class: 'lc-tick', 'text-anchor': 'middle',
        }, String(i)));
      });
      svg.appendChild(svgEl('text', {
        x: mL + pw / 2, y: H - 8, class: 'lc-axis', 'text-anchor': 'middle',
      }, 'Self-improvement iteration'));
      // y-axis title sits horizontally above the axis rather than rotated
      // beside it, so it costs no plot width
      svg.appendChild(svgEl('text', {
        x: 2, y: mT - 14, class: 'lc-axis-title', 'text-anchor': 'start',
      }, 'Success rate (%)'));
      svg.appendChild(svgEl('line', { x1: mL, x2: mL + pw, y1: mT + ph, y2: mT + ph, class: 'chart-baseline' }));

      const path = (vals, attrs) => {
        const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ');
        svg.appendChild(svgEl('path', Object.assign({ d, fill: 'none' }, attrs)));
      };
      // shade the gap between the two curves — that gap is the result
      const band = task.qplanning.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ') +
        ' ' + task.sft.map((v, i) => 'L' + x(task.sft.length - 1 - i) + ' ' + y(task.sft[task.sft.length - 1 - i])).join(' ') + ' Z';
      svg.appendChild(svgEl('path', { d: band, fill: '#4338ca', opacity: 0.07 }));

      path(task.sft, { stroke: '#9ca3af', 'stroke-width': 2, 'stroke-dasharray': '4 3' });
      path(task.qplanning, { stroke: '#4338ca', 'stroke-width': 3, 'stroke-linejoin': 'round' });

      task.sft.forEach((v, i) => svg.appendChild(svgEl('circle', { cx: x(i), cy: y(v), r: 3.5, fill: '#9ca3af' })));
      dots = task.qplanning.map((v, i) => {
        const c = svgEl('circle', { cx: x(i), cy: y(v), r: 5.5, fill: '#4338ca', class: 'si-dot-active' });
        svg.appendChild(c);
        return c;
      });
      task.qplanning.forEach((v, i) => {
        svg.appendChild(svgEl('text', {
          x: x(i) + (i === 0 ? 10 : 0), y: y(v) - 15,
          class: 'lc-value', 'text-anchor': i === 0 ? 'start' : 'middle',
        }, v + '%'));
      });

      // direct labels at the end of each line, instead of a detached legend
      // Sit each series label just beneath its own line, so the plot can use
      // the full width and still line up with the videos.
      const last = task.qplanning.length - 1;
      svg.appendChild(svgEl('text', {
        x: x(last), y: y(task.qplanning[last]) + 30, fill: '#4338ca',
        class: 'lc-end lc-end-strong', 'text-anchor': 'end',
      }, 'Q-Planning'));
      svg.appendChild(svgEl('text', {
        x: x(last), y: y(task.sft[last]) + 28, fill: '#8a8a8a',
        class: 'lc-end', 'text-anchor': 'end',
      }, 'SFT on successes'));

      chartFig.innerHTML = '';
      chartFig.appendChild(svg);
    }

    const chips = Array.from(document.querySelectorAll('.task-chip'));
    const select = (taskKey) => {
      chips.forEach(c => {
        const on = c.dataset.task === taskKey;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      render(taskKey);
    };
    chips.forEach(ch => ch.addEventListener('click', () => select(ch.dataset.task)));

    // ?task=cups deep-links straight to a task
    const wanted = new URLSearchParams(location.search).get('task');
    select(RW.tasks[wanted] ? wanted : 'wallet');
  }

  // ---------- (2) failure modes: one BC rollout vs the Q-Planning recovery ----------
  function initFailureModes(RW) {
    const switchEl = document.getElementById('mode-switch');
    const descEl = document.getElementById('cs-mode-desc');
    const failVideo = document.getElementById('cs-fail-video');
    const failFrame = document.getElementById('cs-fail-frame');
    const failCap = document.getElementById('cs-fail-caption');
    const recVideo = document.getElementById('cs-recovery-video');
    const recFrame = document.getElementById('cs-recovery-frame');
    const recCap = document.getElementById('cs-recovery-caption');
    if (!switchEl || !failVideo) return;

    const failRec = {
      video: failVideo, frame: failFrame, bar: failFrame.querySelector('.status-bar'),
      timeEl: null, successAt: null, group: 'cs',
    };
    const recRec = {
      video: recVideo, frame: recFrame, bar: recFrame.querySelector('.status-bar'),
      timeEl: null, successAt: 0, group: 'cs',
    };
    tracked.push(failRec, recRec);

    const showMode = (mode) => {
      descEl.innerHTML = mode.desc;

      failVideo.src = VID_DIR + mode.clip + '.mp4';
      failVideo.poster = VID_DIR + mode.clip + '.jpg';
      failCap.innerHTML = mode.label;

      const rec = RW.recovery[mode.task];
      recVideo.src = VID_DIR + rec.src + '.mp4';
      recVideo.poster = VID_DIR + rec.src + '.jpg';
      recCap.innerHTML = rec.caption + ' &middot; ' + RW.tasks[mode.task].label;
      recRec.successAt = rec.successAt;

      [failVideo, recVideo].forEach(v => {
        v.muted = true;
        v.loop = true;
        if (csVisible) {
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      });
      schedule();
    };

    RW.failureModes.forEach((mode, i) => {
      const b = document.createElement('button');
      b.className = 'mode-chip' + (i === 0 ? ' is-active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.textContent = mode.label;
      b.addEventListener('click', () => {
        switchEl.querySelectorAll('.mode-chip').forEach(c => {
          c.classList.remove('is-active');
          c.setAttribute('aria-selected', 'false');
        });
        b.classList.add('is-active');
        b.setAttribute('aria-selected', 'true');
        showMode(mode);
      });
      switchEl.appendChild(b);
    });
    showMode(RW.failureModes[0]);
  }

  // ---------- (3) multi-series line charts ----------
  // Spread labels vertically so none collide, then keep the stack inside the plot.
  function deoverlapLabels(items, minGap, top, bottom) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
    }
    const overflow = items[items.length - 1].y - bottom;
    if (overflow > 0) items.forEach(it => { it.y -= overflow; });
    if (items[0].y < top) {
      const shift = top - items[0].y;
      items.forEach(it => { it.y += shift; });
    }
    return items;
  }

  function initLineCharts(RW) {
    // A chart is one or more stacked panels sharing an x-axis. Splitting lets
    // the tightly-clustered leaders get a zoomed band of their own while the
    // unstable baselines keep a full-range band — one shared axis would
    // squash the 93.5 / 95 / 99 gaps that are the actual result.
    const build = (figId, cfg) => {
      const fig = document.getElementById(figId);
      if (!fig) return;
      responsiveSVG(fig, (W) => buildAt(fig, cfg, W));
    };

    const buildAt = (fig, cfg, W) => {
      const compact = W < 560;
      const mL = 58, mR = 20, mT = 40, mB = 56, gap = 28;
      const panels = cfg.panels || [{ ymin: cfg.ymin, ymax: cfg.ymax, ticks: cfg.ticks, h: 1 }];
      const bodyH = cfg.height || 430;
      const totalH = bodyH * panels.reduce((a, p) => a + p.h, 0) + gap * (panels.length - 1);
      const H = totalH + mT + mB;
      const pw = W - mL - mR;
      const its = cfg.iterations;
      const x = i => mL + (pw * i) / (its.length - 1);

      let top = mT;
      const scale = cfg.scale || 'linear';
      panels.forEach(p => {
        p.top = top; p.h_px = bodyH * p.h;
        if (scale === 'log') {
          // plain log on success rate
          const l0 = Math.log10(p.ymin), l1 = Math.log10(p.ymax);
          p.y = v => p.top + p.h_px * (1 - (Math.log10(Math.max(v, 1e-6)) - l0) / (l1 - l0));
        } else if (scale === 'log-error') {
          // log on the distance from 100%: expands the near-saturated region
          const e = v => Math.max(100 - v, 0.05);
          const l0 = Math.log10(e(p.ymin)), l1 = Math.log10(e(p.ymax));
          p.y = v => p.top + p.h_px * ((Math.log10(e(v)) - l1) / (l0 - l1));
        } else {
          p.y = v => p.top + p.h_px * (1 - (v - p.ymin) / (p.ymax - p.ymin));
        }
        top += p.h_px + gap;
      });
      const lastPanel = panels[panels.length - 1];

      const svg = svgEl('svg', {
        width: W, height: H, viewBox: `0 0 ${W} ${H}`,
        class: 'lc-svg', role: 'img', 'aria-label': cfg.aria,
      });
      panels.forEach(p => {
        p.ticks.forEach(t => {
          svg.appendChild(svgEl('line', { x1: mL, x2: mL + pw, y1: p.y(t), y2: p.y(t), class: 'chart-grid' }));
          svg.appendChild(svgEl('text', {
            x: mL - 10, y: p.y(t) + 5, class: 'lc-tick', 'text-anchor': 'end',
          }, (Number.isInteger(t) ? t : t.toFixed(1)) + '%'));
        });
        svg.appendChild(svgEl('line', {
          x1: mL, x2: mL + pw, y1: p.top + p.h_px, y2: p.top + p.h_px, class: 'chart-baseline',
        }));
        if (p.title) {
          svg.appendChild(svgEl('text', { x: mL, y: p.top - 6, class: 'lc-panel-title' }, p.title));
        }
      });
      its.forEach(i => svg.appendChild(svgEl('text', {
        x: x(i), y: lastPanel.top + lastPanel.h_px + 24, class: 'lc-tick', 'text-anchor': 'middle',
      }, String(i))));
      svg.appendChild(svgEl('text', {
        x: mL + pw / 2, y: H - 10, class: 'lc-axis', 'text-anchor': 'middle',
      }, 'Self-improvement iteration'));
      svg.appendChild(svgEl('text', {
        x: 2, y: panels[0].top - 14, class: 'lc-axis-title', 'text-anchor': 'start',
      }, 'Success rate (%)'));

      // Draw only the in-range part of each series. A series that drops below
      // the axis floor exits the plot and stops, rather than running flat
      // along the bottom where it would read as sitting at the floor value.
      const seriesPath = (vals, p) => {
        let d = '', pen = false;
        for (let i = 0; i < vals.length; i++) {
          const v = vals[i], inRange = v >= p.ymin;
          if (inRange) {
            d += (pen ? 'L' : 'M') + x(i) + ' ' + p.y(Math.min(v, p.ymax)) + ' ';
            pen = true;
          } else {
            if (pen) {
              // interpolate to the exact crossing of the floor, then lift the pen
              const pv = vals[i - 1];
              const f = (pv - p.ymin) / (pv - v);
              d += 'L' + (x(i - 1) + (x(i) - x(i - 1)) * f) + ' ' + p.y(p.ymin) + ' ';
            }
            pen = false;
          }
        }
        return d.trim();
      };

      const lead = cfg.series[0];
      panels.forEach(p => {
        const mine = cfg.series.filter(s => !p.keys || p.keys.includes(s.key));
        mine.forEach(s => {
          const attrs = {
            d: seriesPath(s.values, p), fill: 'none', stroke: s.color, 'stroke-width': s.width,
            'stroke-linejoin': 'round', 'stroke-linecap': 'round',
          };
          if (s.dash) attrs['stroke-dasharray'] = s.dash;
          svg.appendChild(svgEl('path', attrs));
        });
        // markers on the emphasised series only, so the measured points read
        if (mine.includes(lead)) {
          lead.values.forEach((v, i) => {
            if (v >= p.ymin) svg.appendChild(svgEl('circle', { cx: x(i), cy: p.y(v), r: 4, fill: lead.color }));
          });
        }
        // Direct end-of-line labels with each series' final value: this is what
        // makes the plateau gaps legible without tracing lines by colour.
        // Name each line directly beneath itself, no legend and no repeated
        // percentages — the axis already carries the values. Anchors are
        // staggered along x so labels for adjacent lines cannot collide.
        // Name each line directly beneath itself. Anchor on the last point that
        // is still on the axis, then walk backwards along the line until the
        // label clears every one already placed — a fixed stagger is not
        // enough when two long names sit at nearly the same height.
        const n = its.length;
        const placed = [];
        const CH = 7.6, LH = 20;   // approx advance width and line height at 17px
        mine.forEach(s => {
          let lastIn = -1;
          for (let i = 0; i < n; i++) if (s.values[i] >= p.ymin && s.values[i] <= p.ymax) lastIn = i;
          if (lastIn < 0) return;

          const w = s.label.length * CH;
          let box = null, fallback = null;
          // Try each point back along the line, below the line first and then
          // above it. Saturated suites (Goal 99 / Object 100 / Spatial 98.5)
          // sit too close for a below-only rule to ever separate them.
          outer:
          for (let tries = 0; tries <= lastIn; tries++) {
            const cand = lastIn - tries;
            for (const side of [24, -14]) {
              const anchor = cand === n - 1 ? 'end' : cand === 0 ? 'start' : 'middle';
              const cx = x(cand);
              const x0 = anchor === 'end' ? cx - w : anchor === 'start' ? cx : cx - w / 2;
              const cy = p.y(s.values[cand]) + side;
              let b = { x0, x1: x0 + w, y0: cy - LH * 0.75, y1: cy + LH * 0.25, anchor, cx, cy };
              // keep the label inside the plot rather than running to the edge
              if (b.x1 > mL + pw) {
                b = { ...b, anchor: 'end', cx: mL + pw, x0: mL + pw - w, x1: mL + pw };
              } else if (b.x0 < mL) {
                b = { ...b, anchor: 'start', cx: mL, x0: mL, x1: mL + w };
              }
              if (b.y0 < p.top || b.y1 > p.top + p.h_px) continue;   // stay in the panel
              if (!fallback) fallback = b;
              const hits = placed.some(q => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
              if (!hits) { box = b; break outer; }
            }
          }
          if (!box) box = fallback;
          if (!box) return;
          placed.push(box);
          svg.appendChild(svgEl('text', {
            x: box.cx, y: box.cy, fill: s.color, 'text-anchor': box.anchor,
            class: s === lead ? 'lc-end lc-end-strong' : 'lc-end',
          }, s.label));
        });
      });

      fig.innerHTML = '';
      fig.appendChild(svg);

      if (cfg.caption) {
        const cap = document.createElement('figcaption');
        cap.innerHTML = cfg.caption;
        fig.appendChild(cap);
      }
    };

    build('baselines-chart', {
      iterations: RW.libero10.iterations,
      series: RW.libero10.series,
      height: 470,
      scale: 'log-error',
      ymin: 60, ymax: 99.5,
      ticks: [60, 80, 90, 95, 98, 99],
      aria: 'LIBERO-10 success rate against self-improvement iteration for Q-Planning and five baselines.',
      caption: '<strong>LIBERO-10 under an identical online budget.</strong> IBRL and DSRL are both ' +
        'unstable; IBRL leaves the axis after iteration&nbsp;2 and ends at 2%.',
    });

    build('breadth-chart', {
      iterations: RW.breadth.iterations,
      series: RW.breadth.series,
      height: 360,
      ymin: 80, ymax: 101,
      ticks: [80, 85, 90, 95, 100],
      aria: 'Success rate against self-improvement iteration for four LIBERO suites and RoboTwin.',
      caption: '<strong>Breadth across LIBERO suites and bimanual RoboTwin.</strong> Where success is ' +
        'already saturated, the loop improves efficiency instead of success rate.',
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });

  // ================= Interactive results chart =================
  const chartEl = document.getElementById('results-chart');
  const tooltipEl = document.getElementById('chart-tooltip');
  if (!chartEl || !tooltipEl) return;

  const methods = [
    { key: 'fastwam',       label: 'FastWAM',              color: '#9ca3af', hover: '#6b7280' },
    { key: 'qplan-offline', label: 'Q-Planning (offline)', color: '#a5b4fc', hover: '#818cf8' },
    { key: 'qplan-online',  label: 'Q-Planning (online)',  color: '#4338ca', hover: '#312e81' },
  ];

  const values = {
    'fastwam':       { success: 90.0, eplen: 274 },
    'qplan-offline': { success: 93.0, eplen: 261 },
    'qplan-online':  { success: 99.0, eplen: 232 },
  };

  const metrics = [
    {
      key: 'success',
      title: 'Success rate on LIBERO-10',
      yLabel: 'Success (%)',
      ymin: 85, ymax: 100,
      ticks: [85, 90, 95, 100],
      format: v => v.toFixed(1) + '%',
      betterHigh: true,
    },
    {
      key: 'eplen',
      title: 'Episode length on LIBERO-10',
      yLabel: 'Steps',
      ymin: 200, ymax: 290,
      ticks: [200, 220, 240, 260, 280],
      format: v => Math.round(v) + ' steps',
      betterHigh: false,
    },
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function buildPanel(metric) {
    // Layout: panel is 340 x 240; plot area inset by margins.
    const W = 340, H = 240;
    const mL = 46, mR = 14, mT = 40, mB = 66;
    const plotW = W - mL - mR;
    const plotH = H - mT - mB;

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      class: 'chart-svg',
      role: 'img',
      'aria-label': metric.title,
    });

    // Title
    svg.appendChild(el('text', {
      x: W / 2, y: 20, class: 'chart-title', 'text-anchor': 'middle',
    }, metric.title));

    // Y-axis: gridlines + tick labels
    const yScale = (v) => mT + plotH * (1 - (v - metric.ymin) / (metric.ymax - metric.ymin));
    for (const t of metric.ticks) {
      const y = yScale(t);
      svg.appendChild(el('line', {
        x1: mL, x2: mL + plotW, y1: y, y2: y, class: 'chart-grid',
      }));
      svg.appendChild(el('text', {
        x: mL - 8, y: y + 4, class: 'chart-tick', 'text-anchor': 'end',
      }, String(t)));
    }
    // Y-axis label
    svg.appendChild(el('text', {
      x: -H / 2 + 12, y: 14, transform: `rotate(-90)`, class: 'chart-axis-label', 'text-anchor': 'middle',
    }, metric.yLabel));

    // Baseline
    svg.appendChild(el('line', {
      x1: mL, x2: mL + plotW, y1: mT + plotH, y2: mT + plotH, class: 'chart-baseline',
    }));

    // Bars
    const groupW = plotW / methods.length;
    const barW = Math.min(58, groupW * 0.55);
    methods.forEach((m, i) => {
      const v = values[m.key][metric.key];
      const cx = mL + groupW * (i + 0.5);
      const x = cx - barW / 2;
      const y = yScale(v);
      const h = mT + plotH - y;

      const rect = el('rect', {
        x, y, width: barW, height: Math.max(0, h),
        rx: 3, ry: 3,
        fill: m.color,
        class: 'chart-bar',
        'data-method': m.key,
        'data-metric': metric.key,
        'data-value': v,
        'data-label': m.label,
        'data-formatted': metric.format(v),
        'data-cell': `cell-libero10-${m.key}-${metric.key}`,
      });
      rect.style.setProperty('--bar-color', m.color);
      rect.style.setProperty('--bar-hover', m.hover);
      svg.appendChild(rect);

      // Persistent value label above bar
      svg.appendChild(el('text', {
        x: cx, y: y - 6, class: 'chart-bar-value', 'text-anchor': 'middle',
      }, metric.format(v)));

      // Method label under bar (two lines if needed)
      const parts = m.label.split(' ');
      if (parts.length > 1 && m.label.length > 10) {
        svg.appendChild(el('text', {
          x: cx, y: mT + plotH + 18, class: 'chart-x-label', 'text-anchor': 'middle',
        }, parts[0]));
        svg.appendChild(el('text', {
          x: cx, y: mT + plotH + 34, class: 'chart-x-label', 'text-anchor': 'middle',
        }, parts.slice(1).join(' ')));
      } else {
        svg.appendChild(el('text', {
          x: cx, y: mT + plotH + 22, class: 'chart-x-label', 'text-anchor': 'middle',
        }, m.label));
      }
    });

    return svg;
  }

  // Wrap panels in the figure element
  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'chart-panels';
  metrics.forEach(m => {
    const wrap = document.createElement('div');
    wrap.className = 'chart-panel';
    wrap.appendChild(buildPanel(m));
    panelsWrap.appendChild(wrap);
  });
  chartEl.appendChild(panelsWrap);

  const caption = document.createElement('figcaption');
  caption.innerHTML = '<strong>LIBERO-10 comparison.</strong> Bar heights show mean success rate (left) and mean successful-episode length (right) for the frozen BC baseline (FastWAM), Q-Planning without any online interaction (offline), and Q-Planning after six rounds of self-improvement (online). Hover a bar to highlight the corresponding cell in the table below.';
  chartEl.appendChild(caption);

  // ================= Hover interactions =================
  let currentHighlightedCell = null;
  const clearHighlight = () => {
    if (currentHighlightedCell) {
      currentHighlightedCell.classList.remove('highlight');
      currentHighlightedCell = null;
    }
  };

  const showTooltip = (bar, ev) => {
    const label = bar.getAttribute('data-label');
    const value = bar.getAttribute('data-formatted');
    tooltipEl.innerHTML = `<div class="tt-label">${label}</div><div class="tt-value">${value}</div>`;
    tooltipEl.classList.add('visible');
    positionTooltip(ev);
  };

  const positionTooltip = (ev) => {
    const pad = 12;
    const rect = tooltipEl.getBoundingClientRect();
    let x = ev.clientX + pad;
    let y = ev.clientY - rect.height - pad;
    if (x + rect.width + 4 > window.innerWidth) x = ev.clientX - rect.width - pad;
    if (y < 8) y = ev.clientY + pad;
    tooltipEl.style.left = `${x + window.scrollX}px`;
    tooltipEl.style.top  = `${y + window.scrollY}px`;
  };

  const hideTooltip = () => {
    tooltipEl.classList.remove('visible');
  };

  chartEl.addEventListener('mouseover', (ev) => {
    const bar = ev.target.closest('.chart-bar');
    if (!bar) return;
    bar.classList.add('is-hover');
    const cellId = bar.getAttribute('data-cell');
    const cell = document.getElementById(cellId);
    clearHighlight();
    if (cell) {
      cell.classList.add('highlight');
      currentHighlightedCell = cell;
    }
    showTooltip(bar, ev);
  });

  chartEl.addEventListener('mousemove', (ev) => {
    if (tooltipEl.classList.contains('visible')) positionTooltip(ev);
  });

  chartEl.addEventListener('mouseout', (ev) => {
    const bar = ev.target.closest('.chart-bar');
    if (!bar) return;
    bar.classList.remove('is-hover');
    hideTooltip();
    clearHighlight();
  });

  // Touch fallback: tap a bar to toggle
  chartEl.addEventListener('click', (ev) => {
    const bar = ev.target.closest('.chart-bar');
    if (!bar) { hideTooltip(); clearHighlight(); return; }
    ev.preventDefault();
    showTooltip(bar, ev);
    const cell = document.getElementById(bar.getAttribute('data-cell'));
    clearHighlight();
    if (cell) { cell.classList.add('highlight'); currentHighlightedCell = cell; }
  });
})();
