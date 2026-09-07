#!/usr/bin/env node
// Playwright driver for the TMA frontend (apps/frontend) running outside Telegram
// (i.e. in a plain browser, where App.tsx falls back to a mock user).
//
// Usage:
//   node driver.mjs <command> [args...]
//
// Commands:
//   open <url> <screenshot.png>              navigate, wait for load, screenshot
//   click-tab <url> <tabId> <screenshot.png> click a TabBar tab (dashboard|storage|integrations|settings), screenshot
//   click-text <url> <text> <screenshot.png> click first element containing <text>, screenshot
//   eval <url> <jsExpression>                run a JS expression in page context, print JSON result
//
// All commands launch headless Chromium from the pre-installed browser path,
// load <url>, wait for the app shell (`.tab-bar`) to actually render, run the
// action, then close.

import { chromium } from "playwright";

const EXECUTABLE_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function withPage(url, fn) {
  const browser = await chromium.launch({
    executablePath: EXECUTABLE_PATH,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
    const logs = [];
    page.on("console", (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
    await page.goto(url, { waitUntil: "networkidle" });
    // #root is present in the static HTML before React even loads, so waiting on it alone
    // would report success on a blank page if the bundle fails to compile/import/render.
    // .tab-bar only exists once App.tsx has actually mounted and rendered.
    await page.waitForSelector(".tab-bar", { timeout: 10000 });
    const result = await fn(page);
    return { result, logs };
  } finally {
    await browser.close();
  }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (cmd === "open") {
    const [url, out] = args;
    const { logs } = await withPage(url, async (page) => {
      await page.screenshot({ path: out });
    });
    console.log(JSON.stringify({ ok: true, screenshot: out, logs }, null, 2));
    return;
  }

  if (cmd === "click-tab") {
    const [url, tabId, out] = args;
    const { logs } = await withPage(url, async (page) => {
      await page.click(`[data-tab-id="${tabId}"], button:has-text("${tabId}")`, { timeout: 5000 }).catch(async () => {
        // Fallback: TabBar renders buttons with visible labels, not data-tab-id.
        await page.click(`text=${tabId}`, { timeout: 5000 });
      });
      await page.waitForTimeout(300);
      await page.screenshot({ path: out });
    });
    console.log(JSON.stringify({ ok: true, screenshot: out, logs }, null, 2));
    return;
  }

  if (cmd === "click-text") {
    const [url, text, out] = args;
    const { logs } = await withPage(url, async (page) => {
      await page.click(`text=${text}`, { timeout: 5000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: out });
    });
    console.log(JSON.stringify({ ok: true, screenshot: out, logs }, null, 2));
    return;
  }

  if (cmd === "eval") {
    const [url, expr] = args;
    const { result, logs } = await withPage(url, async (page) => {
      return page.evaluate(new Function(`return (${expr});`));
    });
    console.log(JSON.stringify({ ok: true, result, logs }, null, 2));
    return;
  }

  console.error("Unknown command. See header comment for usage.");
  process.exit(1);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message, stack: err.stack }));
  process.exit(1);
});
