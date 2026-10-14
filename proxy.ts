import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:", "media-src 'self' blob:", "connect-src 'self'", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://*.openai.com",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
export const config = { matcher: ["/((?!_next/|reiko-assets/|garden/|favicon.ico).*)"] };
