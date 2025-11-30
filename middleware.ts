import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const requestHeaders = new Headers(req.headers);

    const fakePayload = Buffer.from(
      JSON.stringify({
        user_id: "local-dev-user",
        company_id: "local-dev-company",
        email: "local@test.com",
      })
    ).toString("base64");

    const fakeToken = `test.${fakePayload}.test`;

    requestHeaders.set("x-whop-user-token", fakeToken);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};






