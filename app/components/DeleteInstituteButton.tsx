"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteInstituteButton({
  id,
  hasuraToken,
}: {
  id: string;
  hasuraToken: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this institute?")) return;

    setLoading(true);
    try {
      await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hasuraToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation SoftDeleteInstitute($id: uuid!, $deletedAt: timestamptz!) {
              update_interns(
                where: { institute_id: { _eq: $id } }
                _set: { institute_id: null }
              ) {
                affected_rows
              }

              update_institutes_by_pk(
                pk_columns: { id: $id }
                _set: { deleted_at: $deletedAt }
              ) {
                id
              }
            }
          `,
          variables: {
            id,
            deletedAt: new Date().toISOString(),
          },
        }),
      });

      router.push("/dashboard/admin/institutes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-sm hover:bg-red-100 disabled:opacity-50 transition"
    >
      {loading ? "Deleting..." : "Delete Institute"}
    </button>
  );
}
