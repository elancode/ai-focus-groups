import "server-only"

export type CapturedPage = {
  /** Rendered visible text (handles JS-rendered pages). */
  text: string
  /** og:title / document.title, if present. */
  title?: string
  /** JPEG bytes of the rendered page. */
  screenshot: Uint8Array
}

export type CaptureResult =
  | { ok: true; page: CapturedPage }
  | { ok: false; error: string }

/**
 * Render a URL in a real headless browser and return both its rendered text
 * and a screenshot. This handles JavaScript-rendered pages (which a raw HTML
 * fetch cannot) and gives us an image to show the reviewer.
 *
 * Retries once, since the first cold-start launch on serverless can fail.
 * Best-effort: returns { ok: false, error } on failure so the caller can fall
 * back to a plain HTML fetch.
 *
 * - On Vercel / Lambda it uses the bundled @sparticuz/chromium binary.
 * - Locally it drives a system Chromium (override with CHROMIUM_EXECUTABLE_PATH).
 */
export async function capturePage(url: string): Promise<CaptureResult> {
  const onServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  )

  let puppeteer: typeof import("puppeteer-core").default
  let args: string[]
  let executablePath: string
  try {
    puppeteer = (await import("puppeteer-core")).default
    if (onServerless) {
      const chromium = (await import("@sparticuz/chromium")).default
      // Lower memory footprint on the serverless runtime.
      ;(chromium as { setGraphicsMode: boolean }).setGraphicsMode = false
      args = chromium.args
      executablePath = await chromium.executablePath()
    } else {
      args = ["--no-sandbox", "--disable-setuid-sandbox"]
      executablePath =
        process.env.CHROMIUM_EXECUTABLE_PATH || "/opt/pw-browsers/chromium"
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.log("[screenshot] setup failed:", error)
    return { ok: false, error: error.slice(0, 200) }
  }

  let lastError = "unknown error"
  for (let attempt = 1; attempt <= 2; attempt++) {
    let browser: import("puppeteer-core").Browser | undefined
    try {
      browser = await puppeteer.launch({
        args,
        executablePath,
        headless: true,
        defaultViewport: { width: 1280, height: 2000 },
      })

      const page = await browser.newPage()
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 })
      // Give lazy content / fonts a moment to paint, bounded so we never hang.
      await new Promise((r) => setTimeout(r, 1500))

      const extracted = await page.evaluate(() => {
        const og = document.querySelector(
          'meta[property="og:title"]'
        ) as HTMLMetaElement | null
        return {
          text: document.body?.innerText ?? "",
          title: og?.content || document.title || "",
        }
      })

      const screenshot = (await page.screenshot({
        type: "jpeg",
        quality: 72,
      })) as Uint8Array

      return {
        ok: true,
        page: {
          text: extracted.text.replace(/\s+/g, " ").trim(),
          title: extracted.title.trim() || undefined,
          screenshot,
        },
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.log(`[screenshot] attempt ${attempt} failed:`, lastError)
    } finally {
      await browser?.close().catch(() => {})
    }
  }

  return { ok: false, error: lastError.slice(0, 200) }
}
