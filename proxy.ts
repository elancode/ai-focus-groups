import { NextResponse, type NextRequest } from "next/server"

// HTTP Basic Auth gate for the admin dashboard. Runs on the Edge runtime; no
// DB access here — the /admin pages do their own reads in the Node runtime.
export function proxy(req: NextRequest) {
  // Trim so a stray space/newline pasted into the Vercel dashboard can't
  // silently make the credentials unmatchable.
  const user = process.env.ADMIN_USER?.trim()
  const pass = process.env.ADMIN_PASSWORD?.trim()

  // If creds aren't configured, lock the dashboard down entirely rather than
  // leaving it wide open.
  if (!user || !pass) {
    return new NextResponse(
      "Admin dashboard is not configured. Set ADMIN_USER and ADMIN_PASSWORD.",
      { status: 503 }
    )
  }

  const header = req.headers.get("authorization")
  if (header?.startsWith("Basic ")) {
    try {
      // atob() yields one char per byte (Latin-1). Browsers send UTF-8 (we ask
      // for it via charset="UTF-8"), so decode the bytes properly — otherwise
      // any non-ASCII character in the username/password never matches.
      const bytes = Uint8Array.from(atob(header.slice(6).trim()), (c) =>
        c.charCodeAt(0)
      )
      const decoded = new TextDecoder().decode(bytes)
      const i = decoded.indexOf(":")
      const u = decoded.slice(0, i)
      const p = decoded.slice(i + 1)
      if (u === user && p === pass) return NextResponse.next()
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  })
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
