import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();
  
  // Not logged in — redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as any)?.role;
  const pathname = req.nextUrl.pathname;

  // Department role trying to access other dashboards — redirect to department
  if (pathname.startsWith("/dashboard/department") && role !== "department") {
    return NextResponse.redirect(new URL("/dashboard/department", req.url));
  }

  // Intern trying to access other dashboards — redirect to intern
  if (pathname.startsWith("/dashboard/intern") && role !== "intern") {
    return NextResponse.redirect(new URL("/dashboard/intern", req.url));
  }

  // Admin trying to access other dashboards — redirect to admin
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to these routes only
export const config = {
  matcher: ["/dashboard/:path*"],
};