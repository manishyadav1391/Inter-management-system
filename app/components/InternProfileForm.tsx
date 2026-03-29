"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InternProfileForm({
  intern,
  hasuraToken,
}: {
  intern:      any;
  hasuraToken: string;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name:   intern.name   ?? "",
    phone:  intern.phone  ?? "",
    gender: intern.gender ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmedPhone = form.phone.trim();
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);

    const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${hasuraToken}`,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateProfile($id: uuid!, $set: interns_set_input!) {
            update_interns_by_pk(
              pk_columns: { id: $id }
              _set: $set
            ) { id }
          }
        `,
        variables: {
          id:  intern.id,
          set: {
            ...form,
            phone: trimmedPhone || null,
          },
        },
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.errors) {
      setError(json.errors[0].message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 10) {
              setForm((p) => ({ ...p, phone: value }));
            }
          }}
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile number"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          value={form.gender}
          onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition w-fit"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}