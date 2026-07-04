import "server-only"

export type CapturedPage = {
  /** Rendered visible text (handles JS-rendered pages). */
  text: string
  /** og:title / document.title, if present. */
  title?: string
  /** JPEG bytes of the rendered page. */
  screenshot: Uint8Array
}

/**
 * Render a URL in a real headless browser and return both its rendered text
 * and a screenshot. This handles JavaScript-rendered pages (which a raw HTML
 * fetch cannot) and gives us an image to show the reviewer.
 *
 * Best-effort: returns null on any failure so the caller can fall back to a
 * plain HTML fetch.
 *
 * - On Vercel / Lambda it uses the bundled @sparticuz/chromium binary.
 * - Locally it drives a system Chromium (override with CHROMIUM_EXECUTABLE_PATH).
 */
export async function capturePage(url: string): Promise<CapturedPage | null> {
  const onServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  )

  let browser: import("puppeteer-core").Browser | undefined
  try {
    const puppeteer = (await import("puppeteer-core")).default

    let args: string[]
    let executablePath: string

    if (onServerless) {
      const chromium = (await import("@sparticuz/chromium")).default
      args = chromium.args
      executablePath = await chromium.executablePath()
    } else {
      args = ["--no-sandbox", "--disable-setuid-sandbox"]
      executablePath =
        process.env.CHROMIUM_EXECUTABLE_PATH || "/opt/pw-browsers/chromium"
    }

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
      text: extracted.text.replace(/\s+/g, " ").trim(),
      title: extracted.title.trim() || undefined,
      screenshot,
    }
  } catch (err) {
    console.log("[screenshot] capture failed:", err)
    return null
  } finally {
    await browser?.close().catch(() => {})
  }
}
