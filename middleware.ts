import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;
  const hasResetToken = req.nextUrl.searchParams.has("token");
  
  // Not logged in — redirect to login
  if (!session) {
    if (pathname === "/change-password" && hasResetToken) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as any)?.role;
  const mustChangePassword = Boolean((session.user as any)?.mustChangePassword);

  // Force first-login password change before accessing app dashboards.
  if (mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  // Prevent access to change-password page when not required.
  if (!mustChangePassword && pathname === "/change-password" && !hasResetToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
  matcher: ["/dashboard/:path*", "/change-password"],
};