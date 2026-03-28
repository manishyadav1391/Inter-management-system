"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInternDepartmentAction } from "@/app/actions/createInternDepartment";




type Institute  =  { id: string; name: string };
type Status     =  { id: string; status: string };

export default function DepartmentInternForm({
  intern,
  institutes,
  statuses,
  hasuraToken,
}: {
  intern:      any;
  institutes:  Institute[];
  statuses:    Status[];
  hasuraToken: string;
}) {

  const isEdit = !!intern.id;
const router = useRouter();
  const [form, setForm] = useState({
    name:          intern.name          ?? "",
    email:         "",
    password:      "",
    gender:        intern.gender        ?? "",
    phone:         intern.phone         ?? "",
    start_date:    intern.start_date    ?? "",
    end_date:      intern.end_date      ?? "",
    status_id:     intern.status_id     ?? "",
    institute_id:  intern.institute_id  ?? "",
    department_id: intern.department_id ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
  setError("");
  setSuccess(false);

  // 🔥 VALIDATIONS START

  // Name
  if (!form.name || form.name.trim().length < 2) {
    setError("Name must be at least 2 characters");
    return;
  }

  // Email (ONLY on create)
  if (!isEdit) {
    if (!form.email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Invalid email format");
      return;
    }
  }

  // Password (ONLY on create)
  if (!isEdit) {
    if (!form.password) {
      setError("Password is required");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number"
      );
      return;
    }
  }

  // Phone
  if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
    setError("Phone must be 10 digits");
    return;
  }

  // Dates
  if (form.start_date && form.end_date) {
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);

    if (start > end) {
      setError("End date must be after start date");
      return;
    }
  }

  // Required fields (adjust based on your UI)
  if (!form.institute_id) {
    setError("Please select an institute");
    return;
  }

  if (!isEdit && !form.department_id) {
    setError("Please select a department");
    return;
  }

  // 🔥 VALIDATIONS END

  setLoading(true);

  try {
    if (isEdit) {
      // 1. Update existing intern — use JWT directly
      const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            id: intern.id, // Ensure this matches your data type (uuid)
            set: {
              name:         form.name         || null,
              gender:       form.gender       || null,
              phone:        form.phone        || null,
              start_date:   form.start_date   || null,
              end_date:     form.end_date     || null,
              status_id:    form.status_id    || null,
              institute_id: form.institute_id || null,
            },
          },
        }),
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      setSuccess(true);
      
      // Redirect and refresh data for Edit mode
      router.refresh();
      router.push("/dashboard/department");

    } else {
      // 2. Create new intern — server action handles password hashing
      await createInternDepartmentAction({
        name:          form.name,
        email:         form.email,
        password:      form.password,
        gender:        form.gender,
        phone:         form.phone,
        start_date:    form.start_date,
        end_date:      form.end_date,
        status_id:     form.status_id,
        institute_id:  form.institute_id,
        department_id: form.department_id,
      });

      // Redirect and refresh data for Create mode
      router.refresh();
      router.push("/dashboard/department");
    }

  } catch (err: any) {
    // Catching both fetch errors and server action errors
    setError(err.message ?? "Something went wrong");
  } finally {
    setLoading(false);
  }
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
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
          Intern updated successfully!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">

        {/* Name */}
        <Field
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* Email — only on create */}
        {!isEdit && (
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        )}

        {/* Temporary password — only on create */}
        {!isEdit && (
          <Field
            label="Temporary Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        )}

        {/* Phone */}
        <Field
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />

        {/* Start Date */}
        <Field
          label="Start Date"
          name="start_date"
          type="date"
          value={form.start_date}
          onChange={handleChange}
        />

        {/* End Date */}
        <Field
          label="End Date"
          name="end_date"
          type="date"
          value={form.end_date}
          onChange={handleChange}
        />

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Institute */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Institute
          </label>
          <select
            name="institute_id"
            value={form.institute_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
          <select
            name="status_id"
            value={form.status_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.status}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Helper text shown only on create */}
      {!isEdit && (
        <p className="text-xs text-gray-500 mt-3 col-span-2">
          The intern will use this email and temporary password to log in.
          Share the password with them securely after creating the account.
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Intern"
            : "Create Intern"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/department")}
          className="border border-gray-300 text-gray-600 px-6 py-2 rounded text-sm hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Reusable input field
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label:     string;
  name:      string;
  value:     string;
  onChange:  (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?:     string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}