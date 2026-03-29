"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type Props = {
  role: string;
  email: string;
};

// Nav links per role
const navLinks = {
  admin: [
    { href: "/dashboard/admin", label: "Overview" },
    { href: "/dashboard/admin/interns", label: "Interns" },
    { href: "/dashboard/admin/departments", label: "Departments" },
    { href: "/dashboard/admin/institutes", label: "Institutes" },
    { href: "/dashboard/admin/chatbot", label: "Chatbot" },
  ],
  department: [
    { href: "/dashboard/department", label: "Overview" },
    { href: "/dashboard/department/chatbot", label: "Chatbot" },
   
  ],
  intern: [
    { href: "/dashboard/intern", label: "My Profile" },
  ],
};

export default function Navbar({ role, email }: Props) {
  const pathname = usePathname();
  const links = navLinks[role as keyof typeof navLinks] ?? [];

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        
        {/* Left: Logo */}
        <div>
          <h1 className="font-bold text-gray-800 text-sm">
            Intern Management
          </h1>
          <p className="text-xs text-gray-500 capitalize">
            {role} account
          </p>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded text-sm transition ${
                pathname === link.href
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-500 truncate max-w-30">
            {email}
          </p>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}