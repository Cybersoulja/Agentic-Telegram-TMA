#!/usr/bin/env node
// Playwright driver for the TMA frontend (apps/frontend) running outside Telegram
// (i.e. in a plain browser, where App.tsx falls back to a mock user).
//
// Usage:
//   node driver.mjs <command> [args...]
//
// Commands:
//   open <url> <screenshot.png>              navigate, wait for load, screenshot
//   click-tab <url> <tabId> <screenshot.png> click a TabBar tab by id (dashboard|storage|integrations|settings —
//                                             mapped internally to its real rendered label), screenshot
//   click-text <url> <text> <screenshot.png> click first element containing <text>, screenshot
//   eval <url> <jsExpression>                run a JS expression in page context, print JSON result
//
// All commands launch headless Chromium from the pre-installed browser path,
// load <url>, wait for the app shell (`.tab-bar`) to actually render, run the
// action, then close.

import { chromium } from "playwright";

const EXECUTABLE_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// TabBar.tsx renders no `data-tab-id` — only an icon + visible label per button.
// Map each TabId to its actual rendered label so click-tab can target real DOM text
// instead of the (non-existent) id string. Keep in sync with apps/frontend/src/components/TabBar.tsx.
const TAB_LABELS = {
  dashboard: "Dashboard",
  storage: "Cloud & Bio",
  integrations: "Oneseco Hub",
  settings: "Settings",
};

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
    // domcontentloaded, not networkidle: Vite's dev server keeps a persistent HMR
    // websocket open, which can make networkidle hang or flake on a dev server.
    // The explicit .tab-bar wait below is what actually gates on the app having rendered.
    await page.goto(url, { waitUntil: "domcontentloaded" });
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
    const label = TAB_LABELS[tabId];
    if (!label) {
      console.error(`Unknown tabId "${tabId}". Valid values: ${Object.keys(TAB_LABELS).join(", ")}`);
      process.exit(1);
    }
    const { logs } = await withPage(url, async (page) => {
      // Role-based locator, not a hand-built selector string: avoids quoting/escaping
      // pitfalls and matches only real <button> elements (accessible-name substring match).
      await page.getByRole("button", { name: label }).click({ timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: out });
    });
    console.log(JSON.stringify({ ok: true, screenshot: out, logs }, null, 2));
    return;
  }

  if (cmd === "click-text") {
    const [url, text, out] = args;
    const { logs } = await withPage(url, async (page) => {
      await page.getByText(text, { exact: false }).first().click({ timeout: 5000 });
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
