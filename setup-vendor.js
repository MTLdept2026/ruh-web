/**
 * setup-vendor.js
 * ─────────────────────────────────────────────────────────────
 * Downloads all CDN dependencies for Rūḥ and saves them locally
 * into ./vendor/ so the web app works without internet access.
 *
 * Run from the web project root whenever you want to refresh vendor files:
 *   node setup-vendor.js
 * ─────────────────────────────────────────────────────────────
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Directories to create ──────────────────────────────────────
const dirs = [
  './vendor',
  './vendor/phosphor',
  './vendor/phosphor/fonts',
  './vendor/fonts',
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Download helper (follows redirects) ───────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod  = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

// ── Files to download ─────────────────────────────────────────
const CDN_FILES = [
  {
    url:  'https://cdn.tailwindcss.com',
    dest: './vendor/tailwind.js',
    name: 'Tailwind Play CDN',
  },
  {
    url:  'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js',
    dest: './vendor/babel.min.js',
    name: 'Babel Standalone',
  },
  {
    url:  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
    dest: './vendor/react.min.js',
    name: 'React 18',
  },
  {
    url:  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
    dest: './vendor/react-dom.min.js',
    name: 'ReactDOM 18',
  },
  {
    url:  'https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.umd.min.js',
    dest: './vendor/adhan.min.js',
    name: 'Adhan.js',
  },
  {
    url:  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    dest: './vendor/phosphor/regular.css',
    name: 'Phosphor Regular CSS',
  },
  {
    url:  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    dest: './vendor/phosphor/fill.css',
    name: 'Phosphor Fill CSS',
  },
  {
    url:  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    dest: './vendor/phosphor/bold.css',
    name: 'Phosphor Bold CSS',
  },
];

// ── Google Fonts URLs ─────────────────────────────────────────
// We download a local copy of the @import CSS, then fetch each
// font file referenced inside it and rewrite the paths.
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700' +
  '&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500' +
  '&family=Scheherazade+New:wght@400;500;600;700&display=swap';

// ── Step 1: Download core CDN files ───────────────────────────
async function downloadCoreFiles() {
  console.log('\n📦 Downloading core vendor files...\n');
  for (const { url, dest, name } of CDN_FILES) {
    process.stdout.write(`  ${name}... `);
    try {
      await download(url, dest);
      console.log('✓');
    } catch (e) {
      console.log(`✗  (${e.message})`);
    }
  }
}

// ── Step 2: Fix Phosphor font references ─────────────────────
// Each Phosphor CSS file has @font-face rules that reference font
// files via relative paths. We download those font files and
// rewrite the CSS to use local paths.
async function fixPhosphorFonts() {
  console.log('\n🔤 Downloading Phosphor icon fonts...\n');
  const weights = ['regular', 'fill', 'bold'];

  for (const weight of weights) {
    const cssPath = `./vendor/phosphor/${weight}.css`;
    if (!fs.existsSync(cssPath)) continue;

    let css = fs.readFileSync(cssPath, 'utf8');
    const fontMatches = [...css.matchAll(/url\(['"]?([^'")\s]+\.(?:ttf|woff2?|eot)[^'")\s]*)['"]?\)/g)];

    for (const match of fontMatches) {
      const relPath  = match[1].split('?')[0]; // strip query strings
      const baseUrl  = `https://unpkg.com/@phosphor-icons/web@2.1.1/src/${weight}/`;
      let   fontUrl;
      try {
        fontUrl = new URL(relPath, baseUrl).href;
      } catch (_) {
        continue;
      }
      const fontFilename = path.basename(relPath.split('?')[0]);
      const fontDest     = `./vendor/phosphor/fonts/${fontFilename}`;

      process.stdout.write(`  ${fontFilename} (${weight})... `);
      try {
        if (!fs.existsSync(fontDest)) {
          await download(fontUrl, fontDest);
        }
        console.log('✓');
        // Rewrite CSS path
        css = css.split(match[1]).join(`fonts/${fontFilename}`);
      } catch (e) {
        console.log(`✗  (${e.message})`);
      }
    }

    fs.writeFileSync(cssPath, css);
  }
}

// ── Step 3: Download Google Fonts ────────────────────────────
async function downloadGoogleFonts() {
  console.log('\n🔡 Downloading Google Fonts...\n');

  // Fetch the CSS with a desktop UA so we get woff2 files
  const cssDest = './vendor/fonts/google-fonts.css';
  process.stdout.write('  Fetching font CSS... ');

  await new Promise((resolve, reject) => {
    https.get(GOOGLE_FONTS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    }, res => {
      if ([301, 302].includes(res.statusCode)) {
        return reject(new Error('Redirect not followed'));
      }
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        fs.writeFileSync(cssDest, data);
        resolve(data);
      });
    }).on('error', reject);
  }).then(async css => {
    console.log('✓');

    // Extract all woff2 URLs from the CSS
    const fontUrls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);
    let localCss = css;

    for (const fontUrl of fontUrls) {
      const filename = fontUrl.split('/').pop().split('?')[0];
      const fontDest = `./vendor/fonts/${filename}`;
      process.stdout.write(`  ${filename}... `);
      try {
        if (!fs.existsSync(fontDest)) {
          await download(fontUrl, fontDest);
        }
        console.log('✓');
        localCss = localCss.split(fontUrl).join(filename);
      } catch (e) {
        console.log(`✗  (${e.message})`);
      }
    }

    // Write updated CSS with local paths
    fs.writeFileSync(cssDest, localCss);
  }).catch(e => {
    console.log(`✗  Could not fetch Google Fonts CSS: ${e.message}`);
    console.log('  (The app will still work online — fonts will load from Google when connected)');
  });
}

// ── Step 4: Verify app files exist locally ───────────────────
function copyAppFiles() {
  console.log('\n📁 Checking project root for app files...\n');

  const indexDest = './index.html';
  if (fs.existsSync(indexDest)) {
    console.log('  index.html already exists — skipping copy.');
    return;
  }

  console.log('  No index.html found in the project root.');
  console.log('  → Add the app shell first, then run this script again.\n');
}

// ── Step 5: Patch index.html CDN references ───────────────────
function patchIndexHtml() {
  const indexPath = './index.html';
  if (!fs.existsSync(indexPath)) {
    console.log('\n⚠️  index.html not found — skipping HTML patch.');
    console.log('   Add the web app shell first, then run this script again.\n');
    return;
  }

  console.log('\n✏️  Patching index.html to use local vendor files...\n');
  let html = fs.readFileSync(indexPath, 'utf8');
  const original = html;

  const replacements = [
    // Tailwind
    [
      'src="https://cdn.tailwindcss.com"',
      'src="vendor/tailwind.js"',
    ],
    // Phosphor Icons
    [
      'href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"',
      'href="vendor/phosphor/regular.css"',
    ],
    [
      'href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css"',
      'href="vendor/phosphor/fill.css"',
    ],
    [
      'href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"',
      'href="vendor/phosphor/bold.css"',
    ],
    // React
    [
      'src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"',
      'src="vendor/react.min.js"',
    ],
    // ReactDOM
    [
      'src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"',
      'src="vendor/react-dom.min.js"',
    ],
    // Babel
    [
      'src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"',
      'src="vendor/babel.min.js"',
    ],
    // Adhan
    [
      'src="https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.umd.min.js"',
      'src="vendor/adhan.min.js"',
    ],
    // Google Fonts @import → local CSS file
    [
      "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Scheherazade+New:wght@400;500;600;700&display=swap');",
      "@import url('vendor/fonts/google-fonts.css');",
    ],
  ];

  let patchCount = 0;
  for (const [from, to] of replacements) {
    if (html.includes(from)) {
      html = html.split(from).join(to);
      console.log(`  ✓ ${to.split('"')[1]}`);
      patchCount++;
    } else {
      console.log(`  ⚠ Not found (already patched?): ...${from.slice(0, 50)}...`);
    }
  }

  if (html !== original) {
    fs.writeFileSync(indexPath, html);
    console.log(`\n  Saved — ${patchCount} references updated.\n`);
  } else {
    console.log('\n  No changes needed.\n');
  }
}

// ── Main ───────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Rūḥ — Vendor Setup Script');
  console.log('═══════════════════════════════════════════════════');

  await downloadCoreFiles();
  await fixPhosphorFonts();
  await downloadGoogleFonts();
  copyAppFiles();
  patchIndexHtml();

  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Setup complete!');
  console.log('');
  console.log('  Next steps:');
  console.log('  1. If index.html was not found above, add the web app shell first.');
  console.log('  2. Re-run this script with:');
  console.log('       node setup-vendor.js');
  console.log('  3. Start the local server with:');
  console.log('       python3 server.py 3000');
  console.log('═══════════════════════════════════════════════════\n');
})();
