"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Institute = {
  id: string;
  name: string;
  location: string | null;
};

export default function InstituteForm({
  initialData,
  hasuraToken,
}: {
  initialData?: Institute;
  hasuraToken: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    location: initialData?.location ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.name.trim()) {
      setError("Institute name is required");
      return;
    }

    setLoading(true);

    try {
      const body = isEdit
        ? {
            query: `
              mutation UpdateInstitute($id: uuid!, $set: institutes_set_input!) {
                update_institutes_by_pk(pk_columns: { id: $id }, _set: $set) {
                  id
                }
              }
            `,
            variables: {
              id: initialData!.id,
              set: {
                name: form.name.trim(),
                location: form.location.trim() || null,
              },
            },
          }
        : {
            query: `
              mutation CreateInstitute($object: institutes_insert_input!) {
                insert_institutes_one(object: $object) {
                  id
                }
              }
            `,
            variables: {
              object: {
                name: form.name.trim(),
                location: form.location.trim() || null,
              },
            },
          };

      const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hasuraToken}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      if (isEdit) {
        setSuccess(true);
        router.refresh();
      } else {
        router.push("/dashboard/admin/institutes");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
            Institute updated successfully!
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Gujarat Technological University"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Ahmedabad, Gujarat"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update Institute" : "Create Institute"}
          </button>
        </div>
      </form>
    </div>
  );
}
