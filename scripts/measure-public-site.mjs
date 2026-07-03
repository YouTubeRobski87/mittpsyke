import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://mittpsyke.se';
const ROUTES = ['/', '/chatta-anonymt', '/dagbok', '/integritet', '/feedback'];
const OUT_FILE = 'docs/mittpsyke-public-technical-measurement-2026-07-03.json';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const require = createRequire(import.meta.url);
const playwrightCandidates = [
  process.env.PLAYWRIGHT_PACKAGE,
  'playwright-core',
  'playwright',
  process.env.USERPROFILE
    ? path.join(
        process.env.USERPROFILE,
        '.cache',
        'codex-runtimes',
        'codex-primary-runtime',
        'dependencies',
        'node',
        'node_modules',
        '.pnpm',
        'node_modules',
        'playwright-core'
      )
    : null
].filter(Boolean);

let playwright;
for (const candidate of playwrightCandidates) {
  try {
    playwright = require(candidate);
    break;
  } catch {
    // Try the next known package location.
  }
}

if (!playwright) {
  throw new Error('Could not load Playwright. Set PLAYWRIGHT_PACKAGE to a playwright-core package path.');
}

const { chromium } = playwright;

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'permissions-policy',
  'referrer-policy',
  'x-content-type-options'
];

const CACHE_HEADERS = ['cache-control', 'etag', 'expires', 'content-encoding'];

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return normalized;
}

function pickHeaders(headers, names) {
  const out = {};
  for (const name of names) out[name] = headers[name] ?? null;
  return out;
}

function asNumber(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}

async function collectRun(context, route, phase) {
  const url = new URL(route, BASE_URL).toString();
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  const requests = new Map();

  await client.send('Network.enable');
  client.on('Network.requestWillBeSent', (event) => {
    if (!event.request?.url?.startsWith('http')) return;
    requests.set(event.requestId, {
      requestId: event.requestId,
      url: event.request.url,
      method: event.request.method,
      type: event.type,
      phase,
      route,
      status: null,
      mimeType: null,
      encodedDataLength: 0,
      fromDiskCache: false,
      fromServiceWorker: false,
      headers: {},
      cacheHeaders: {},
      securityHeaders: {},
      failed: false,
      failureText: null
    });
  });

  client.on('Network.responseReceived', (event) => {
    const item = requests.get(event.requestId);
    if (!item) return;
    const headers = normalizeHeaders(event.response.headers || {});
    item.status = event.response.status;
    item.mimeType = event.response.mimeType || null;
    item.fromDiskCache = Boolean(event.response.fromDiskCache);
    item.fromServiceWorker = Boolean(event.response.fromServiceWorker);
    item.headers = headers;
    item.cacheHeaders = pickHeaders(headers, CACHE_HEADERS);
    item.securityHeaders = pickHeaders(headers, SECURITY_HEADERS);
  });

  client.on('Network.loadingFinished', (event) => {
    const item = requests.get(event.requestId);
    if (!item) return;
    item.encodedDataLength = Math.round(event.encodedDataLength || 0);
  });

  client.on('Network.loadingFailed', (event) => {
    const item = requests.get(event.requestId);
    if (!item) return;
    item.failed = true;
    item.failureText = event.errorText || null;
  });

  const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      ttfbMs: nav ? Math.round(nav.responseStart - nav.startTime) : null,
      domInteractiveMs: nav ? Math.round(nav.domInteractive - nav.startTime) : null,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      transferSize: nav ? Math.round(nav.transferSize || 0) : null,
      encodedBodySize: nav ? Math.round(nav.encodedBodySize || 0) : null,
      decodedBodySize: nav ? Math.round(nav.decodedBodySize || 0) : null
    };
  });

  const imageAudit = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight };
    const inFold = (rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < innerHeight &&
      rect.left < innerWidth;

    const images = Array.from(document.images).map((img) => {
      const rect = img.getBoundingClientRect();
      return {
        src: img.currentSrc || img.src || null,
        attrSrc: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        loading: img.getAttribute('loading'),
        fetchPriority: img.getAttribute('fetchpriority'),
        decoding: img.getAttribute('decoding'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        rect: {
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        aboveFold: inFold(rect)
      };
    });

    const backgroundImages = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const style = getComputedStyle(el);
      if (!style.backgroundImage || style.backgroundImage === 'none') continue;
      const rect = el.getBoundingClientRect();
      const urls = Array.from(style.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)).map((m) => m[1]);
      for (const src of urls) {
        backgroundImages.push({
          src,
          tagName: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className : '',
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          aboveFold: inFold(rect)
        });
      }
    }

    return { viewport, images, backgroundImages };
  });

  const serviceWorker = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, controller: false, registrations: [] };
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    return {
      supported: true,
      controller: Boolean(navigator.serviceWorker.controller),
      registrations: registrations.map((registration) => ({
        scope: registration.scope,
        activeScriptURL: registration.active?.scriptURL || null,
        waitingScriptURL: registration.waiting?.scriptURL || null,
        installingScriptURL: registration.installing?.scriptURL || null
      }))
    };
  });

  const normalizedMainHeaders = normalizeHeaders(response?.headers() || {});
  const resourceRows = Array.from(requests.values()).sort((a, b) => {
    if (a.url === url) return -1;
    if (b.url === url) return 1;
    return b.encodedDataLength - a.encodedDataLength;
  });

  const result = {
    route,
    url,
    finalUrl: page.url(),
    phase,
    status: response?.status() ?? null,
    mainDocumentHeaders: pickHeaders(normalizedMainHeaders, CACHE_HEADERS),
    securityHeaders: pickHeaders(normalizedMainHeaders, SECURITY_HEADERS),
    metrics,
    requestCount: resourceRows.length,
    transferBytes: resourceRows.reduce((sum, row) => sum + (row.encodedDataLength || 0), 0),
    failedRequestCount: resourceRows.filter((row) => row.failed).length,
    fromCacheCount: resourceRows.filter((row) => row.fromDiskCache).length,
    fromServiceWorkerCount: resourceRows.filter((row) => row.fromServiceWorker).length,
    serviceWorker,
    imageAudit,
    resources: resourceRows
  };

  await client.detach();
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--disable-dev-shm-usage']
  });

  const startedAt = new Date().toISOString();
  const results = [];

  for (const route of ROUTES) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MittPsykeAudit/2026-07-03',
      serviceWorkers: 'allow'
    });

    const cold = await collectRun(context, route, 'cold');
    results.push(cold);

    const warm = await collectRun(context, route, 'warm');
    results.push(warm);

    await context.close();
  }

  await browser.close();

  const payload = {
    measuredAt: startedAt,
    completedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: ROUTES,
    environment: {
      browser: 'Google Chrome via Playwright/Chromium CDP',
      chromePath: CHROME_PATH,
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      cacheMethod: 'cold = new browser context; warm = second navigation in same context',
      network: 'No artificial throttling'
    },
    results
  };

  await writeFile(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
