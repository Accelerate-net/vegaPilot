// Loads an ID-card template from /public/templates/<...>/template-N/
// and exposes its placeholder list, default values, and page dimensions.

function unquote(v) {
  const s = String(v == null ? '' : v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parseMetadata(text) {
  const meta = {
    placeholders: {},
    width: '85.6mm', height: '53.98mm',
    canvasWidth: null, canvasHeight: null,
    printQR: false, printQRId: null,
    reference: null,
    raw: {},
  };
  String(text || '').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1); // keep raw (no trim — defaults may legitimately have leading spaces)
    meta.raw[key] = value;
    if (key === 'width') meta.width = value.trim();
    else if (key === 'height') meta.height = value.trim();
    else if (key === 'canvas.width') meta.canvasWidth = value.trim();
    else if (key === 'canvas.height') meta.canvasHeight = value.trim();
    else if (key === 'reference') meta.reference = unquote(value);
    else if (key === 'printQR') meta.printQR = /^(true|1|yes)$/i.test(value.trim());
    else if (key === 'printQR.id') {
      // `printQR.id=placeholder.STUDENT_ID` → keep just the placeholder name.
      const v = value.trim();
      meta.printQRId = v.startsWith('placeholder.') ? v.slice('placeholder.'.length) : v;
    }
    else if (key.startsWith('placeholder.')) {
      meta.placeholders[key.slice('placeholder.'.length)] = value;
    }
  });
  return meta;
}

// Build an <img> tag that renders a QR encoding `value` via a public QR
// service.  This keeps the integration zero-dependency at the cost of needing
// network access when rendering / printing.
export function buildQrImageTag(value, size = 256) {
  const data = encodeURIComponent(String(value == null ? '' : value));
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${data}`;
  return `<img src="${src}" alt="QR" style="width:100%;height:100%;display:block;object-fit:contain;" />`;
}

// Convert a CSS length string (mm/cm/in/pt/pc/px) to pixels at 96 DPI.
export function toPx(value) {
  if (value == null) return NaN;
  const str = String(value).trim();
  const m = str.match(/^([\d.]+)\s*(mm|cm|in|pt|pc|px)?$/i);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  const unit = (m[2] || 'px').toLowerCase();
  switch (unit) {
    case 'mm': return n * 3.7795275591;
    case 'cm': return n * 37.795275591;
    case 'in': return n * 96;
    case 'pt': return n * (96 / 72);
    case 'pc': return n * 16;
    case 'px':
    default:   return n;
  }
}

// Compute the scale factor that makes a canvas of (canvasW × canvasH) fit
// inside a box of (boxW × boxH) while preserving aspect ratio.
export function fitScale(canvasW, canvasH, boxW, boxH) {
  const cw = toPx(canvasW), ch = toPx(canvasH);
  const bw = toPx(boxW),    bh = toPx(boxH);
  if (!cw || !ch || !bw || !bh) return 1;
  return Math.min(bw / cw, bh / ch);
}

const PLACEHOLDER_RE = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

export function extractPlaceholders(...htmlStrings) {
  const set = new Set();
  htmlStrings.forEach((html) => {
    if (!html) return;
    let match;
    while ((match = PLACEHOLDER_RE.exec(html)) !== null) {
      set.add(match[1]);
    }
  });
  return Array.from(set);
}

export function renderTemplate(html, values) {
  return String(html || '').replace(PLACEHOLDER_RE, (_, key) => {
    const v = values?.[key];
    return v == null ? '' : String(v);
  });
}

async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url.split('/').pop()} ${r.status}`);
  return r.text();
}

// Discover templates under `<rootPath>/` from `<rootPath>/config.json`:
//   { "available": [1, 2] }  →  template-1, template-2
// Each surviving directory's `reference` is read from its metadata for display.
export async function listIcardTemplates(rootPath = '/templates/id-card-student') {
  const root = rootPath.replace(/\/+$/, '');

  let config;
  try {
    config = JSON.parse(await fetchText(`${root}/config.json`));
  } catch (err) {
    throw new Error(`Could not load ${root}/config.json: ${err.message}`);
  }
  const available = Array.isArray(config?.available) ? config.available : [];
  if (available.length === 0) {
    throw new Error(`${root}/config.json has no "available" entries`);
  }
  const dirs = available.map((n) => `template-${n}`);

  const entries = await Promise.all(
    dirs.map(async (dir) => {
      const path = `${root}/${dir}`;
      try {
        const metaText = await fetchText(`${path}/metadata.txt`);
        const metadata = parseMetadata(metaText);
        return { dir, path, reference: metadata.reference || dir, metadata };
      } catch {
        return { dir, path, reference: dir, metadata: null };
      }
    })
  );
  return entries;
}

export async function loadIcardTemplate(templatePath = '/templates/id-card-student/template-1') {
  const base = templatePath.replace(/\/+$/, '');
  const [front, back, metaText] = await Promise.all([
    fetchText(`${base}/front.html`),
    fetchText(`${base}/back.html`),
    fetchText(`${base}/metadata.txt`),
  ]);
  const metadata = parseMetadata(metaText);
  const placeholders = extractPlaceholders(front, back);
  // `baseHref` is what we inject as <base href="..."> when the template is
  // embedded into an iframe; it resolves relative URLs (background.svg, etc.)
  // back to the template directory regardless of the iframe's own URL.
  const baseHref = new URL(`${base}/`, window.location.origin).href;
  return { base, baseHref, front, back, metadata, placeholders };
}

// Rewrite relative URLs inside an HTML fragment so they resolve against the
// template directory.  Covers <img src="...">, <... src="...">, and CSS
// `url(...)` references.  Absolute URLs (http://, //, data:, /…) are left
// untouched.
export function absolutifyAssets(html, baseHref) {
  if (!html || !baseHref) return html || '';
  const base = baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
  const isAbs = (u) => !u || /^(?:[a-z]+:|\/\/|#|data:|blob:|\/)/i.test(u);
  return String(html)
    // src="..." and href="..." attributes
    .replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (m, attr, q, url) =>
      isAbs(url) ? m : `${attr}=${q}${base}${url}${q}`)
    // CSS url(...) — handles url('x'), url("x"), url(x)
    .replace(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi, (m, q, url) =>
      isAbs(url) ? m : `url(${q}${base}${url}${q})`);
}

// Wrap a (possibly fragment) template so it can be embedded into an iframe via
// `srcdoc` while keeping its exact markup intact and resolving relative URLs
// against the template directory.  If the template already declares <html>,
// we only inject the <base> tag; otherwise we wrap it in a minimal document.
export function wrapForFrame(html, baseHref) {
  const hasHtml = /<html[\s>]/i.test(html);
  const baseTag = baseHref ? `<base href="${baseHref}">` : '';
  if (hasHtml) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, (m) => `${m}${baseTag}`);
    }
    return html.replace(/<html([^>]*)>/i, (m) => `${m}<head>${baseTag}</head>`);
  }
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
${baseTag}
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style>
</head>
<body>
${html}
</body>
</html>`;
}

// Escape a string for use inside an HTML attribute value (double-quoted).
function attr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Build a multi-page PDF-ready HTML doc: one page per student, with the
// rendered front.html and back.html embedded verbatim (full <!doctype html>
// documents) inside iframes via `srcdoc`.  This guarantees the template
// renders exactly as authored — its own <html>, <head>, <style>, and <body>
// untouched.
export function buildPrintDocument({ template, students, valuesFor, title = 'ID Cards' }) {
  const { width, height, canvasWidth, canvasHeight } = template.metadata;

  // If the template declares an intrinsic pixel canvas, render the iframe at
  // those exact dimensions and scale it down to the physical card size so the
  // px-based layout inside renders pixel-perfectly.
  const hasCanvas = Boolean(canvasWidth && canvasHeight);
  const scale = hasCanvas ? fitScale(canvasWidth, canvasHeight, width, height) : 1;
  const slotInner = hasCanvas
    ? `width:${canvasWidth};height:${canvasHeight};
       transform:scale(${scale});
       transform-origin:top left;`
    : `width:${width};height:${height};`;

  // One page per side: front on its own page, back on the next, repeated per
  // student.  For N students this yields 2N pages in front, back, front, back…
  // order.
  const pages = students
    .map((student, idx) => {
      const values = valuesFor(student);
      const front = absolutifyAssets(renderTemplate(template.front, values), template.baseHref);
      const back = absolutifyAssets(renderTemplate(template.back, values), template.baseHref);
      return `
        <section class="ic-page" data-idx="${idx + 1}" data-side="front">
          <div class="ic-slot"><div class="ic-canvas">${front}</div></div>
        </section>
        <section class="ic-page" data-idx="${idx + 1}" data-side="back">
          <div class="ic-slot"><div class="ic-canvas">${back}</div></div>
        </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: ${width} ${height}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #eef1f5; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; }
  .ic-toolbar { position: sticky; top:0; z-index:10; background:#0b1220; color:#fff;
    padding:8px 16px; display:flex; gap:12px; align-items:center; }
  .ic-toolbar button { background:#2563eb; color:#fff; border:none; padding:6px 14px;
    border-radius:4px; font-weight:600; cursor:pointer; }
  .ic-page {
    width: ${width}; height: ${height};
    display: flex; padding: 0;
    page-break-after: always; break-after: page;
    background: #fff; margin: 8px auto;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  }
  .ic-page:last-child { page-break-after: auto; break-after: auto; }
  .ic-slot {
    width: ${width}; height: ${height};
    overflow: hidden; background: #fff; position: relative;
  }
  .ic-canvas {
    position: absolute; top: 0; left: 0;
    ${slotInner}
  }
  @media print {
    body { background: #fff; }
    .ic-toolbar { display: none; }
    .ic-page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="ic-toolbar">
    <strong>${title} · ${students.length} student${students.length === 1 ? '' : 's'}</strong>
    <button onclick="window.print()">Save as PDF / Print</button>
    <span style="opacity:.7;font-size:12px">Choose "Save as PDF" as the destination. Page size is fixed to the template (${width} × ${height}).</span>
  </div>
  ${pages}
  <script>
    // Wait for any embedded images to finish loading, then print.
    (function () {
      var imgs = Array.prototype.slice.call(document.images);
      if (imgs.length === 0) { setTimeout(function(){ window.print(); }, 300); return; }
      var pending = imgs.length;
      function done() { if (--pending <= 0) setTimeout(function(){ window.print(); }, 300); }
      imgs.forEach(function (img) {
        if (img.complete) done();
        else { img.addEventListener('load', done, { once: true });
               img.addEventListener('error', done, { once: true }); }
      });
    })();
  </script>
</body>
</html>`;
}
