const { chromium } = require("playwright");
const SHOT_DIR = "/private/tmp/claude-502/-Users-leo-Projetos-Leo-sakura-ia-cadastro/6d854751-8773-4bf7-b9ea-c7ff9a511578/scratchpad";
const ID = "cmrs7nwss000ct5zl3flwvusm";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill("admin@cadastroai.com");
  await page.locator('input[type="password"]').fill("Sakura@2026");
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForTimeout(1200);

  await page.goto(`http://localhost:3001/painel/${ID}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Clica no anexo do RG/CNH do sócio
  await page.locator("text=/^socio-0-rg/").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT_DIR}/modal-doc-aberto.png` });
  console.log("[test] ok");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
