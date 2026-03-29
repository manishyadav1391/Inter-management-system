"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type Props = {
  role:  string;
  email: string;
};

// Nav links per role
const navLinks = {
  admin: [
    { href: "/dashboard/admin",          label: "Overview"    },
    { href: "/dashboard/admin/interns",  label: "Interns"     },
    { href: "/dashboard/admin/departments", label: "Departments" },
    { href: "/dashboard/admin/institutes", label: "Institutes" },
    { href: "/dashboard/admin/chatbot", label: "Chatbot" },
  ],
  department: [
    { href: "/dashboard/department",         label: "Overview" },
    { href: "/dashboard/department/chatbot", label: "Chatbot" },
    // { href: "/dashboard/department/interns", label: "Interns"  },
  ],
  intern: [
    { href: "/dashboard/intern", label: "My Profile" },
  ],
};

export default function Sidebar({ role, email }: Props) {
  const pathname = usePathname();
  const links    = navLinks[role as keyof typeof navLinks] ?? [];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="font-bold text-gray-800 text-sm">
          Intern Management
        </h1>
        <p className="text-xs text-gray-500 mt-1 capitalize">
          {role} account
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
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

      {/* User info + logout */}
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate mb-2">{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}