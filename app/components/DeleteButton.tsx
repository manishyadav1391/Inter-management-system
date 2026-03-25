"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({
  id,
  hasuraToken,
}: {
  id:           string;
  hasuraToken:  string;
}) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this intern?")) return;

    setLoading(true);
    try {
      await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${hasuraToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation DeleteIntern($id: uuid!) {
              delete_interns_by_pk(id: $id) { id }
            }
          `,
          variables: { id },
        }),
      });

      router.push("/dashboard/admin/interns");
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
      {loading ? "Deleting..." : "Delete Intern"}
    </button>
  );
}