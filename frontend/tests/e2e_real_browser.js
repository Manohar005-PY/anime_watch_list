/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

async function runRealBrowserTests() {
  console.log('=== KAGE PLAYWRIGHT REAL BROWSER E2E TEST SUITE ===');
  console.log('Launching headless Chromium browser...\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Real Browser Navigation to Registration
    // -------------------------------------------------------------
    console.log('[1] Creating real browser context & navigating to /register...');
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    const pageTitle = await pageA.title();
    console.log('    Page loaded. Document Title:', pageTitle);

    // -------------------------------------------------------------
    // Test 2: Real Browser Form Input & Account Registration
    // -------------------------------------------------------------
    console.log('\n[2] Filling real registration form inputs...');
    const userAEmail = `playwright_user_${Date.now()}@kage.internal`;
    const userAName = 'Spike Spiegel Playwright';
    const userAPass = 'Password123!';

    await pageA.fill('input#email', userAEmail);
    await pageA.fill('input#displayName', userAName);
    await pageA.fill('input#password', userAPass);
    await pageA.fill('input#confirmPassword', userAPass);

    console.log('    Submitting registration form button via real browser click...');
    await Promise.all([
      pageA.waitForResponse(res => res.url().includes('/api/v1/auth/login') && res.status() === 200),
      pageA.click('button[type="submit"]'),
    ]);

    await pageA.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('    Navigation succeeded! Current URL:', pageA.url());

    // -------------------------------------------------------------
    // Test 3: Real Browser Cookie Jar & HttpOnly Security Validation
    // -------------------------------------------------------------
    console.log('\n[3] Inspecting browser cookie jar & JavaScript document.cookie...');
    const contextCookies = await contextA.cookies(BASE_URL);
    const sessionCookie = contextCookies.find(c => c.name === 'kage_session');
    const csrfCookie = contextCookies.find(c => c.name === 'kage_csrf');

    if (!sessionCookie) throw new Error('Missing kage_session cookie in browser jar');
    if (!csrfCookie) throw new Error('Missing kage_csrf cookie in browser jar');

    console.log('    Browser Jar kage_session HttpOnly:', sessionCookie.httpOnly);
    console.log('    Browser Jar kage_csrf HttpOnly:', csrfCookie.httpOnly);
    console.log('    Browser Jar kage_csrf value:', csrfCookie.value.slice(0, 25) + '...');

    if (!sessionCookie.httpOnly) {
      throw new Error('Security Violation: kage_session MUST be HttpOnly');
    }
    if (csrfCookie.httpOnly) {
      throw new Error('Configuration Error: kage_csrf MUST NOT be HttpOnly so client JS can read it');
    }

    // Verify document.cookie in page DOM
    const docCookie = await pageA.evaluate(() => document.cookie);
    console.log('    DOM document.cookie contains kage_csrf:', docCookie.includes('kage_csrf='));
    console.log('    DOM document.cookie contains kage_session:', docCookie.includes('kage_session='));

    if (docCookie.includes('kage_session=')) {
      throw new Error('CRITICAL VULNERABILITY: HttpOnly session cookie leaked into document.cookie!');
    }
    if (!docCookie.includes('kage_csrf=')) {
      throw new Error('document.cookie must contain kage_csrf for double-submit header attachment');
    }

    // -------------------------------------------------------------
    // Test 4: Authenticated Mutation via Real Browser window.fetch
    // -------------------------------------------------------------
    console.log('\n[4] Executing authenticated POST mutation in real browser DOM...');
    const createRes = await pageA.evaluate(async () => {
      const match = document.cookie.match(/kage_csrf=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : '';
      const r = await window.fetch('/api/v1/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({
          title: 'Cowboy Bebop: Knockin on Heaven Door',
          status: 'WATCHING',
          total_episodes: 1,
          genres: ['Action', 'Sci-Fi'],
        }),
      });
      return { status: r.status, data: await r.json() };
    });

    console.log('    Creation Status:', createRes.status, 'Title:', createRes.data.title);
    if (createRes.status !== 201 || !createRes.data.id) {
      throw new Error('Failed to create anime: ' + JSON.stringify(createRes));
    }
    const animeId = createRes.data.id;

    // -------------------------------------------------------------
    // Test 5: Real Browser CSRF Protection (Missing X-CSRF-Token Header)
    // -------------------------------------------------------------
    console.log('\n[5] Executing mutation WITHOUT X-CSRF-Token in browser (Expect 403)...');
    const missingCsrfRes = await pageA.evaluate(async (id) => {
      const r = await window.fetch(`/api/v1/anime/${id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched_episodes: 1 }),
      });
      return { status: r.status, data: await r.json() };
    }, animeId);

    console.log('    Status:', missingCsrfRes.status, 'Detail:', missingCsrfRes.data.detail);
    if (missingCsrfRes.status !== 403) {
      throw new Error('Security Failure: Browser permitted mutation without CSRF header');
    }

    // -------------------------------------------------------------
    // Test 6: Real Browser CSRF Protection (Forged / Malicious Token)
    // -------------------------------------------------------------
    console.log('\n[6] Executing mutation with forged CSRF token in browser (Expect 403)...');
    const forgedCsrfRes = await pageA.evaluate(async (id) => {
      const r = await window.fetch(`/api/v1/anime/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'attacker.forged.signature_1234567890abcdef',
        },
        body: JSON.stringify({ watched_episodes: 1 }),
      });
      return { status: r.status, data: await r.json() };
    }, animeId);

    console.log('    Status:', forgedCsrfRes.status, 'Detail:', forgedCsrfRes.data.detail);
    if (forgedCsrfRes.status !== 403) {
      throw new Error('Security Failure: Browser permitted mutation with forged CSRF header');
    }

    // -------------------------------------------------------------
    // Test 7: Legitimate Progress Update via Real Browser
    // -------------------------------------------------------------
    console.log('\n[7] Updating anime progress with valid CSRF in browser...');
    const updateRes = await pageA.evaluate(async (id) => {
      const match = document.cookie.match(/kage_csrf=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : '';
      const r = await window.fetch(`/api/v1/anime/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({ watched_episodes: 1 }),
      });
      return { status: r.status, data: await r.json() };
    }, animeId);

    console.log('    Status:', updateRes.status, 'Watched:', updateRes.data.watched_episodes);
    if (updateRes.status !== 200 || updateRes.data.watched_episodes !== 1) {
      throw new Error('Progress update failed');
    }

    // -------------------------------------------------------------
    // Test 8: Tenant Data Isolation across Separate Browser Contexts
    // -------------------------------------------------------------
    console.log('\n[8] Testing Cross-User Tenant Isolation in separate Browser Context...');
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Register User B in Context B
    const userBEmail = `playwright_userb_${Date.now()}@kage.internal`;
    await pageB.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await pageB.fill('input#email', userBEmail);
    await pageB.fill('input#displayName', 'Faye Valentine Playwright');
    await pageB.fill('input#password', 'Password123!');
    await pageB.fill('input#confirmPassword', 'Password123!');
    await Promise.all([
      pageB.waitForResponse(res => res.url().includes('/api/v1/auth/login') && res.status() === 200),
      pageB.click('button[type="submit"]'),
    ]);
    await pageB.waitForURL('**/dashboard', { timeout: 10000 });

    // User B attempts to read User A's anime
    const breachAttempt = await pageB.evaluate(async (id) => {
      const r = await window.fetch(`/api/v1/anime/${id}`);
      return { status: r.status };
    }, animeId);

    console.log('    User B Read User A Anime Status:', breachAttempt.status);
    if (breachAttempt.status !== 404) {
      throw new Error('CRITICAL TENANT ISOLATION FAILURE: User B read User A data!');
    }
    await contextB.close();

    // -------------------------------------------------------------
    // Test 9: Real Browser Logout & Session Revocation
    // -------------------------------------------------------------
    console.log('\n[9] Executing logout in real browser context...');
    const logoutRes = await pageA.evaluate(async () => {
      const match = document.cookie.match(/kage_csrf=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : '';
      const r = await window.fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
      });
      return { status: r.status };
    });

    console.log('    Logout API Status:', logoutRes.status);
    if (logoutRes.status !== 200) throw new Error('Logout API failed');

    // Verify session cookie is invalidated in backend
    const postLogoutMe = await pageA.evaluate(async () => {
      const r = await window.fetch('/api/v1/auth/me');
      return { status: r.status };
    });
    console.log('    Post-logout /api/v1/auth/me status:', postLogoutMe.status);
    if (postLogoutMe.status !== 401) {
      throw new Error('Session remained active after logout');
    }

    // -------------------------------------------------------------
    // Test 10: Anonymous Pre-Auth CSRF Token Verification
    // -------------------------------------------------------------
    console.log('\n[10] Verifying anonymous pre-auth CSRF bootstrap in fresh browser context...');
    const contextAnon = await browser.newContext();
    const pageAnon = await contextAnon.newPage();
    await pageAnon.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const bootstrapRes = await pageAnon.evaluate(async () => {
      const r = await window.fetch('/api/v1/auth/csrf-token');
      return { status: r.status, data: await r.json() };
    });
    console.log('    Anonymous bootstrap status:', bootstrapRes.status);
    console.log('    Anonymous token issued:', bootstrapRes.data.csrf_token.slice(0, 20) + '...');
    if (bootstrapRes.status !== 200 || !bootstrapRes.data.csrf_token.startsWith('anon')) {
      throw new Error('Pre-auth anonymous CSRF token format unexpected');
    }
    await contextAnon.close();

    console.log('\n=== ALL 10 PLAYWRIGHT REAL BROWSER TESTS PASSED! ===');
  } finally {
    await browser.close();
  }
}

runRealBrowserTests().catch(err => {
  console.error('\n❌ REAL BROWSER TEST FAILED:', err);
  process.exit(1);
});
