"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  limit: number;
  totalRecords: number;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  limit,
  totalRecords,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updatePagination = useCallback(
    (newPage: number, newLimit?: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", Math.max(1, newPage).toString());
      if (newLimit !== undefined) {
        params.set("limit", newLimit.toString());
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center justify-between mt-6">
      {/* Left: Total records info */}
      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-medium">
          {Math.min((currentPage - 1) * limit + 1, totalRecords || 0)}
        </span>{" "}
        to{" "}
        <span className="font-medium">
          {Math.min(currentPage * limit, totalRecords || 0)}
        </span>{" "}
        of <span className="font-medium">{totalRecords || 0}</span> records
      </div>

      {/* Center: Rows per page */}
      <div className="flex items-center gap-2">
        <label htmlFor="limit" className="text-sm text-gray-600">
          Rows per page:
        </label>
        <select
          id="limit"
          value={limit}
          onChange={(e) => updatePagination(1, parseInt(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      {/* Right: Navigation buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => updatePagination(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 border rounded text-sm transition ${
            currentPage <= 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          Previous
        </button>

        {/* Page indicators */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = idx + 1;
            } else if (currentPage <= 3) {
              pageNum = idx + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + idx;
            } else {
              pageNum = currentPage - 2 + idx;
            }

            if (pageNum < 1 || pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => updatePagination(pageNum)}
                className={`px-2 py-1 border rounded text-sm transition ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => updatePagination(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 border rounded text-sm transition ${
            currentPage >= totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}