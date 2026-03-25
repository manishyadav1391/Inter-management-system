"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function InternFilters({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  // Update URL params without full page reload
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex gap-3 flex-wrap">
      {/* Search */}
      <input
        type="text"
        placeholder="Search name or email..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Gender filter */}
      <select
        defaultValue={searchParams.get("gender") ?? ""}
        onChange={(e) => updateFilter("gender", e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Genders</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      {/* Department filter */}
      <select
        defaultValue={searchParams.get("department") ?? ""}
        onChange={(e) => updateFilter("department", e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      {/* Clear filters */}
      <button
        onClick={() => router.push(pathname)}
        className="border border-gray-300 text-gray-600 px-3 py-2 rounded text-sm hover:bg-gray-50 transition"
      >
        Clear
      </button>
    </div>
  );
}