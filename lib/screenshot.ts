import "server-only"

/**
 * Capture a screenshot of a URL as a JPEG byte array, for feeding to the
 * vision-capable Design panel. Best-effort: returns null on any failure so the
 * caller can fall back to text-only analysis.
 *
 * - On Vercel / Lambda it uses the bundled @sparticuz/chromium binary.
 * - Locally it drives a system Chromium (defaults to the path used in this
 *   dev environment; override with CHROMIUM_EXECUTABLE_PATH).
 */
export async function captureScreenshot(url: string): Promise<Uint8Array | null> {
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
    await new Promise((r) => setTimeout(r, 1200))

    const buf = (await page.screenshot({
      type: "jpeg",
      quality: 72,
    })) as Uint8Array

    return buf
  } catch (err) {
    console.log("[screenshot] capture failed:", err)
    return null
  } finally {
    await browser?.close().catch(() => {})
  }
}
