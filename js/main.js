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
