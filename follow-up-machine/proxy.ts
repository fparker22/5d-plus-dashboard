import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate: send signed-out visitors to the login page before the app
// renders. The real check happens again in the layout and in every action.
export function proxy(request: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next();
  if (request.cookies.get("fum_session")) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/app/:path*", "/agency/:path*"] };
