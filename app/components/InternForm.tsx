 "use client";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import { createInternAction } from "@/app/actions/createIntern";

  type Department = { id: string; name: string };
  type Institute  = { id: string; name: string };
  type Status     = { id: string; status: string };

  export default function InternForm({
    departments,
    institutes,
    statuses,
    hasuraToken,
    initialData,
  }: {
    departments:  Department[];
    institutes:   Institute[];
    statuses:     Status[];
    hasuraToken:  string;
    initialData?: any;
  }) {
    const router = useRouter();
    const isEdit = !!initialData;

    const [form, setForm] = useState({
      name:          initialData?.name          ?? "",
      email:         "",                            // only for create
      password:      "",                            // only for create
      gender:        initialData?.gender        ?? "",
      phone:         initialData?.phone         ?? "",
      department_id: initialData?.department_id ?? "",
      institute_id:  initialData?.institute_id  ?? "",
      start_date:    initialData?.start_date    ?? "",
      end_date:      initialData?.end_date      ?? "",
      status_id:     initialData?.status_id     ?? "",
    });

    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    function handleChange(
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        if (isEdit) {
          // Update — no password change, use JWT directly
          const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${hasuraToken}`,
            },
            body: JSON.stringify({
              query: `
                mutation UpdateIntern($id: uuid!, $set: interns_set_input!) {
                  update_interns_by_pk(
                    pk_columns: { id: $id }
                    _set: $set
                  ) { id }
                }
              `,
              variables: {
                id:  initialData.id,
                set: {
                  name:          form.name,
                  gender:        form.gender        || null,
                  phone:         form.phone         || null,
                  department_id: form.department_id || null,
                  institute_id:  form.institute_id  || null,
                  start_date:    form.start_date    || null,
                  end_date:      form.end_date      || null,
                  status_id:     form.status_id     || null,
                },
              },
            }),
          });

          const json = await res.json();
          if (json.errors) throw new Error(json.errors[0].message);

        } else {
          // Create — server action handles password hashing + user creation
          const result = await createInternAction(form);
          
          // If your server action returns an error object, catch it here
          if (result?.error) {
            throw new Error(result.error);
          }
        }

        // 1. Refresh the data for the new page
        router.refresh(); 
        
        // 2. Redirect the user
        router.push("/dashboard/admin/interns");
        
      } catch (err: any) {
        console.error("Submit Error:", err);
        setError(err.message ?? "Something went wrong");
        setLoading(false); // Only stop loading if there is an error
      }
      // Note: We don't setLoading(false) in 'finally' if we are redirecting, 
      // as it can cause a flicker on the button before the page changes.
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl"
      >
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">

          <Field label="Name" name="name" value={form.name}
            onChange={handleChange} required />

          {/* Email + Password only shown when creating */}
          {!isEdit && (
            <>
              <Field label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} required />
              <Field label="Temporary Password" name="password" type="password"
                value={form.password} onChange={handleChange} required />
            </>
          )}

          <Field label="Phone" name="phone" value={form.phone}
            onChange={handleChange} />

          <Field label="Start Date" name="start_date" type="date"
            value={form.start_date} onChange={handleChange} />

          <Field label="End Date" name="end_date" type="date"
            value={form.end_date} onChange={handleChange} />

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select name="department_id" value={form.department_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Institute */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute
            </label>
            <select name="institute_id" value={form.institute_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">Select institute</option>
              {institutes.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select name="status_id" value={form.status_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">Select status</option>
              {statuses?.map((s) => (
                <option key={s.id} value={s.id}>{s.status}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Helper text for password */}
        {!isEdit && (
          <p className="text-xs text-gray-500 mt-3">
            The intern will use this email and password to log in.
            Share the temporary password with them securely.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Saving..." : isEdit ? "Update Intern" : "Create Intern"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded text-sm hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  function Field({ label, name, value, onChange, type = "text", required = false }: {
    label: string; name: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string; required?: boolean;
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange}
          required={required}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }