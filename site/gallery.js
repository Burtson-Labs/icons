/* The catalog is embedded by build.mjs. No network, framework, or external font required. */
(() => {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const isBrand = (i) => Boolean(i.d);
  const key = (i) => (isBrand(i) ? 'brand-' : '') + i.n;
  const label = (i) => (isBrand(i) ? i.ti : i.n.replace(/-/g, ' '));
  const all = [...D.icons, ...D.brands];
  const categories = [['all', 'All icons'], ...Object.entries(D.titles), ['brands', 'Brand logos']];
  let selected = D.icons.find((i) => i.n === 'stealth-mask') || D.icons[0];
  let category = 'all';
  let format = 'react';
  let savedOnly = false;
  let visible = [];
  let saved = new Set();
  try {
    const data = JSON.parse(localStorage.getItem('bl-icons-saved') || '[]');
    if (Array.isArray(data)) saved = new Set(data.filter((v) => all.some((i) => key(i) === v)));
  } catch (err) {
    /* Storage is optional. */
    void err;
  }
  const media = matchMedia('(max-width: 850px)');
  const dialog = $('mobile-inspector');
  const inspector = $('inspector');
  const desktopAnchor = document.createComment('Inspector desktop position');
  inspector.before(desktopAnchor);
  let lastTrigger;
  let noticeTimer;
  const toast = (message) => {
    clearTimeout(noticeTimer);
    $('toast').textContent = message;
    $('toast').style.display = 'block';
    noticeTimer = setTimeout(() => {
      $('toast').style.display = 'none';
    }, 3200);
  };
  const size = () => Number($('size').value);
  const weight = () => Number($('weight').value);
  // Built with DOM calls rather than markup strings, so nothing here can
  // become HTML injection. svg() below stays for the copy/download text.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const allowedTags = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
  function svgNode(i, dimension = 24, decorative = true, colored = false) {
    const el = document.createElementNS(SVG_NS, 'svg');
    el.setAttribute('width', String(dimension));
    el.setAttribute('height', String(dimension));
    el.setAttribute('viewBox', '0 0 24 24');
    if (decorative) el.setAttribute('aria-hidden', 'true');
    else {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', label(i));
    }
    if (isBrand(i)) {
      el.setAttribute('fill', colored ? i.h : 'currentColor');
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', i.d);
      el.append(path);
      return el;
    }
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', String(weight()));
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    for (const [tag, attrs] of i.g) {
      if (!allowedTags.has(tag)) continue;
      const node = document.createElementNS(SVG_NS, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
      el.append(node);
    }
    return el;
  }
  const textEl = (tag, text, className) => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  function svg(i, dimension = 24, decorative = true, colored = false) {
    const a11y = decorative
      ? 'aria-hidden="true"'
      : 'role="img" aria-label="' + esc(label(i)) + '"';
    const attrs = isBrand(i)
      ? 'fill="' + (colored ? i.h : 'currentColor') + '"'
      : 'fill="none" stroke="currentColor" stroke-width="' +
        weight() +
        '" stroke-linecap="round" stroke-linejoin="round"';
    const geometry = isBrand(i)
      ? '<path d="' + esc(i.d) + '"/>'
      : i.g
          .map(
            ([tag, attrs]) =>
              '<' +
              tag +
              ' ' +
              Object.entries(attrs)
                .map(([k, v]) => k + '="' + esc(v) + '"')
                .join(' ') +
              '/>',
          )
          .join('');
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      dimension +
      '" height="' +
      dimension +
      '" viewBox="0 0 24 24" ' +
      attrs +
      ' ' +
      a11y +
      ' focusable="false">' +
      geometry +
      '</svg>'
    );
  }
  function code() {
    const i = selected;
    const decorative = $('decorative').checked;
    const a11y = decorative ? 'aria-hidden="true"' : 'aria-label=' + JSON.stringify(label(i));
    if (format === 'react')
      return (
        'import { ' +
        i.p +
        " } from '@burtson-labs/icons/" +
        (isBrand(i) ? 'brands/react/' : 'react/') +
        i.n +
        "';\n\n<" +
        i.p +
        '\n  size={' +
        size() +
        '}\n  ' +
        (isBrand(i) ? 'colored\n  ' : 'strokeWidth={' + weight() + '}\n  ') +
        a11y +
        '\n/>'
      );
    if (format === 'svg') return svg(i, size(), decorative, isBrand(i)).replace(/></g, '>\n<');
    const directory = isBrand(i) ? 'brands/svg-color' : 'svg-accent';
    return (
      '<img\n  src="https://icons.burtson.ai/' +
      directory +
      '/' +
      i.n +
      '.svg"\n  width="' +
      size() +
      '" height="' +
      size() +
      '"\n  alt="' +
      (decorative ? '' : esc(label(i))) +
      '"\n/>\n\n<!-- Version-pinned asset -->\nhttps://cdn.jsdelivr.net/npm/@burtson-labs/icons@' +
      D.version +
      '/dist/' +
      directory +
      '/' +
      i.n +
      '.svg'
    );
  }
  function syncURL() {
    const url = new URL(location.href);
    for (const [k, v] of Object.entries({
      q: $('search').value.trim(),
      collection: category === 'all' ? '' : category,
      size: size() === 28 ? '' : String(size()),
      stroke: weight() === 2 ? '' : String(weight()),
      format: format === 'react' ? '' : format,
      decorative: $('decorative').checked ? '' : 'false',
    })) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    url.hash = key(selected);
    history.replaceState(null, '', url);
  }
  function paintInspector() {
    $('selected-name').textContent = selected.n;
    $('selected-status').textContent = isBrand(selected)
      ? selected.ti + ' · ' + selected.gr
      : selected.c.map((c) => D.titles[c] || c).join(' / ');
    $('selected-preview').replaceChildren(svgNode(selected, 96, true, isBrand(selected)));
    $('sizes').replaceChildren(
      ...[16, 24, 32].map((s) => {
        const cell = document.createElement('div');
        cell.append(svgNode(selected, s), textEl('small', s + 'px'));
        return cell;
      }),
    );
    $('code').textContent = code();
    $('code').setAttribute('aria-labelledby', 'format-' + format);
    $('export-note').textContent =
      format === 'cdn'
        ? 'CDN files use their published weight. Use React or SVG for your custom stroke.'
        : $('decorative').checked
          ? 'Decorative: hidden from assistive technology. Give the parent button its own label.'
          : 'Meaningful: includes an accessible name.';
    $('weight').disabled = isBrand(selected);
    $('save').textContent = saved.has(key(selected)) ? 'Saved ✓' : 'Save icon';
    $('save').setAttribute('aria-pressed', String(saved.has(key(selected))));
    $('saved-count').textContent = saved.size;
    $('tags').replaceChildren(
      ...(isBrand(selected) ? ['Trademark of its owner'] : selected.t).map((t) => {
        const e = document.createElement(isBrand(selected) ? 'span' : 'button');
        e.textContent = t;
        if (!isBrand(selected)) {
          e.type = 'button';
          e.onclick = () => {
            $('search').value = t;
            category = 'all';
            dialog.close();
            render();
            syncURL();
            $('search').focus();
          };
        }
        return e;
      }),
    );
    document.querySelectorAll('[data-tab]').forEach((b) => {
      b.id = 'format-' + b.dataset.tab;
      b.setAttribute('aria-selected', String(b.dataset.tab === format));
      b.setAttribute('aria-controls', 'code');
      b.tabIndex = b.dataset.tab === format ? 0 : -1;
    });
    document
      .querySelectorAll('.tile')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key(selected))));
  }
  function openInspector(trigger) {
    lastTrigger = trigger;
    if (media.matches) {
      dialog.append(inspector, $('toast'));
      if (!dialog.open) dialog.showModal();
    }
  }
  dialog.addEventListener('close', () => {
    desktopAnchor.after(inspector);
    document.body.append($('toast'));
    const trigger = lastTrigger?.isConnected ? lastTrigger : $('search');
    trigger?.focus();
  });
  $('close-inspector').onclick = () => dialog.close();
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  media.addEventListener('change', () => {
    if (dialog.open) dialog.close();
  });
  const normalize = (text) => text.toLowerCase().replace(/[-_]/g, ' ');
  function render() {
    const q = normalize($('search').value.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    const pool = category === 'brands' ? D.brands : D.icons;
    visible = pool
      .filter((i) => {
        const words = normalize(
          [i.n, ...(i.t || []), ...(i.a || []), i.ti || '', i.gr || ''].join(' '),
        );
        return (
          (category === 'all' || category === 'brands' || i.c.includes(category)) &&
          (!savedOnly || saved.has(key(i))) &&
          terms.every((t) => words.includes(t))
        );
      })
      .sort((a, b) => {
        const score = (i) => (normalize(i.n) === q ? 3 : normalize(i.n).startsWith(q) ? 2 : 1);
        return (q ? score(b) - score(a) : 0) || a.n.localeCompare(b.n);
      });
    const active = visible.some((i) => key(i) === key(selected))
      ? key(selected)
      : key(visible[0] || selected);
    $('grid').replaceChildren(
      ...visible.map((i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tile';
        button.dataset.key = key(i);
        button.tabIndex = key(i) === active ? 0 : -1;
        button.setAttribute('aria-label', label(i));
        button.setAttribute('aria-pressed', String(key(i) === key(selected)));
        button.append(svgNode(i), textEl('span', i.n, 'name'));
        if (saved.has(key(i))) {
          const mark = textEl('span', '★', 'saved-mark');
          mark.setAttribute('aria-hidden', 'true');
          button.append(mark);
        }
        button.onclick = () => {
          selected = i;
          paintInspector();
          syncURL();
          openInspector(button);
        };
        return button;
      }),
    );
    $('result-count').textContent = visible.length + (category === 'brands' ? ' logos' : ' icons');
    $('empty').style.display = visible.length ? 'none' : 'block';
    $('category-title').textContent =
      (savedOnly ? 'Saved · ' : '') + categories.find(([id]) => id === category)[1];
    $('collection').value = category;
    $('saved-only').setAttribute('aria-pressed', String(savedOnly));
    $('saved-count').textContent = saved.size;
    document.querySelectorAll('.cats button').forEach((b) => {
      b.classList.toggle('active', b.dataset.category === category);
      b.setAttribute('aria-pressed', String(b.dataset.category === category));
    });
  }
  for (const [id, title] of categories) {
    const count =
      id === 'brands'
        ? D.brands.length
        : D.icons.filter((i) => id === 'all' || i.c.includes(id)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.category = id;
    button.append(textEl('span', title), textEl('b', String(count)));
    button.onclick = () => {
      category = id;
      render();
      syncURL();
    };
    $('cats').append(button);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = title + ' (' + count + ')';
    $('collection').append(option);
  }
  $('collection').onchange = () => {
    category = $('collection').value;
    render();
    syncURL();
  };
  $('saved-only').onclick = () => {
    savedOnly = !savedOnly;
    render();
  };
  $('save').onclick = () => {
    const k = key(selected);
    if (saved.has(k)) saved.delete(k);
    else saved.add(k);
    try {
      localStorage.setItem('bl-icons-saved', JSON.stringify([...saved]));
    } catch {
      toast('Saved for this visit. Browser storage is unavailable.');
    }
    paintInspector();
    render();
  };
  function reset() {
    $('search').value = '';
    category = 'all';
    savedOnly = false;
    render();
    syncURL();
    $('search').focus();
  }
  $('reset').onclick = reset;
  $('empty-reset').onclick = reset;
  $('search').oninput = () => {
    render();
    syncURL();
  };
  for (const [id, property, out, suffix] of [
    ['size', '--size', 'sizeout', 'px'],
    ['weight', '--weight', 'weightout', ''],
  ]) {
    $(id).oninput = () => {
      root.style.setProperty(property, $(id).value + suffix);
      $(out).textContent = $(id).value;
      paintInspector();
      syncURL();
    };
  }
  $('decorative').onchange = () => {
    paintInspector();
    syncURL();
  };
  const formats = [...document.querySelectorAll('[data-tab]')];
  formats.forEach((b, index) => {
    b.onclick = () => {
      format = b.dataset.tab;
      paintInspector();
      syncURL();
    };
    b.onkeydown = (e) => {
      const target =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? formats.length - 1
            : e.key === 'ArrowRight'
              ? (index + 1) % formats.length
              : e.key === 'ArrowLeft'
                ? (index + formats.length - 1) % formats.length
                : null;
      if (target !== null) {
        e.preventDefault();
        formats[target].click();
        formats[target].focus();
      }
    };
  });
  $('grid').addEventListener('keydown', (e) => {
    const tiles = [...$('grid').querySelectorAll('.tile')];
    const index = tiles.indexOf(document.activeElement);
    if (index < 0) return;
    const columns = tiles.filter((t) => t.offsetTop === tiles[0].offsetTop).length || 1;
    const target =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tiles.length - 1
          : e.key === 'ArrowRight'
            ? index + 1
            : e.key === 'ArrowLeft'
              ? index - 1
              : e.key === 'ArrowDown'
                ? index + columns
                : e.key === 'ArrowUp'
                  ? index - columns
                  : null;
    if (target !== null) {
      e.preventDefault();
      const next = tiles[Math.max(0, Math.min(tiles.length - 1, target))];
      tiles.forEach((t) => {
        t.tabIndex = t === next ? 0 : -1;
      });
      next.focus();
    }
  });
  const copy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast('Clipboard unavailable. Select and copy the code manually.');
      $('code').focus();
    }
  };
  $('copy').onclick = () => copy(code(), 'Code copied');
  $('share').onclick = () => {
    syncURL();
    return copy(location.href, 'Link copied');
  };
  $('download').onclick = () => {
    const data = svg(selected, size(), $('decorative').checked, isBrand(selected));
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = selected.n + '.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('SVG downloaded');
  };
  const dark = () =>
    root.dataset.theme
      ? root.dataset.theme === 'dark'
      : !matchMedia('(prefers-color-scheme: light)').matches;
  const paintTheme = () => {
    $('theme').textContent = dark() ? 'Light mode' : 'Dark mode';
    $('theme').setAttribute('aria-label', 'Switch to ' + (dark() ? 'light' : 'dark') + ' theme');
  };
  $('theme').onclick = () => {
    root.dataset.theme = dark() ? 'light' : 'dark';
    try {
      localStorage.setItem('bl-icons-theme', root.dataset.theme);
    } catch (err) {
      /* Optional browser state may be unavailable. */
      void err;
    }
    paintTheme();
  };
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', paintTheme);
  const accents = [...document.querySelectorAll('.accents button')];
  const paintAccent = () =>
    accents.forEach((b) => {
      const checked = b.dataset.accent === (root.dataset.accent || 'ink');
      b.setAttribute('aria-checked', String(checked));
      b.tabIndex = checked ? 0 : -1;
    });
  accents.forEach((b, index) => {
    b.onclick = () => {
      root.dataset.accent = b.dataset.accent;
      try {
        localStorage.setItem('bl-icons-accent', b.dataset.accent);
      } catch (err) {
        /* Optional browser state may be unavailable. */
        void err;
      }
      paintAccent();
    };
    b.onkeydown = (e) => {
      const target = ['ArrowRight', 'ArrowDown'].includes(e.key)
        ? (index + 1) % accents.length
        : ['ArrowLeft', 'ArrowUp'].includes(e.key)
          ? (index + accents.length - 1) % accents.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? accents.length - 1
              : null;
      if (target !== null) {
        e.preventDefault();
        accents[target].click();
        accents[target].focus();
      }
    };
  });
  document.addEventListener('keydown', (e) => {
    const typing = document.activeElement?.matches(
      'input,textarea,select,[contenteditable="true"]',
    );
    if (e.key === '/' && !typing && !dialog.open && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      $('search').focus();
    }
    if (e.key === 'Escape' && document.activeElement === $('search')) {
      e.preventDefault();
      $('search').value = '';
      render();
      syncURL();
    }
  });
  function readURL() {
    const params = new URLSearchParams(location.search);
    category = categories.some(([id]) => id === params.get('collection'))
      ? params.get('collection')
      : 'all';
    $('search').value = params.get('q') || '';
    format = ['react', 'svg', 'cdn'].includes(params.get('format'))
      ? params.get('format')
      : 'react';
    $('decorative').checked = params.get('decorative') !== 'false';
    for (const [id, param, min, max, step, fallback] of [
      ['size', 'size', 16, 48, 4, 28],
      ['weight', 'stroke', 1, 3, 0.25, 2],
    ]) {
      const n = Number(params.get(param));
      $(id).value = String(
        params.has(param) && Number.isFinite(n)
          ? Math.round(Math.min(max, Math.max(min, n)) / step) * step
          : fallback,
      );
    }
    root.style.setProperty('--size', size() + 'px');
    root.style.setProperty('--weight', weight());
    $('sizeout').textContent = size();
    $('weightout').textContent = weight();
    let hash = '';
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch (err) {
      /* Optional browser state may be unavailable. */
      void err;
    }
    const icon = all.find((i) => key(i) === hash);
    if (icon) {
      selected = icon;
      if (isBrand(icon)) category = 'brands';
    }
    render();
    paintInspector();
  }
  window.addEventListener('popstate', readURL);
  window.addEventListener('hashchange', readURL);
  paintTheme();
  paintAccent();
  readURL();
})();
