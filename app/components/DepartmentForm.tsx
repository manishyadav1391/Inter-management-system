"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDepartmentHeadAction } from "@/app/actions/createDepartmentHead";

type DepartmentHead = { id: string; email: string };

export default function DepartmentForm({
  initialData,
  departmentHeads,
  hasuraToken,
}: {
  initialData?:    any;
  departmentHeads: DepartmentHead[];
  hasuraToken:     string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name:    initialData?.name    ?? "",
    head_id: initialData?.head_id ?? "",
  });

  // New head creation form state
  const [showCreateHead, setShowCreateHead] = useState(false);
  const [headForm, setHeadForm] = useState({
    email:    "",
    password: "",
  });

  const [loading,        setLoading]        = useState(false);
  const [creatingHead,   setCreatingHead]   = useState(false);
  const [error,          setError]          = useState("");
  const [headError,      setHeadError]      = useState("");
  const [success,        setSuccess]        = useState(false);
  const [headSuccess,    setHeadSuccess]    = useState("");

  // Local list of heads — updates when a new one is created
  const [heads, setHeads] = useState<DepartmentHead[]>(departmentHeads);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleHeadFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHeadForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Create department head inline
  async function handleCreateHead(e: React.FormEvent) {
    e.preventDefault();
    if (!initialData?.id) {
      setHeadError("Save the department first before assigning a head.");
      return;
    }

    setCreatingHead(true);
    setHeadError("");

    try {
      const newUser = await createDepartmentHeadAction({
        email:         headForm.email,
        password:      headForm.password,
        department_id: initialData.id,
      });

      // Add to local heads list and auto-select
      setHeads((prev) => [...prev, { id: newUser.id, email: newUser.email }]);
      setForm((prev) => ({ ...prev, head_id: newUser.id }));
      setHeadSuccess(`${newUser.email} created, assigned as head, and credentials emailed.`);
      setHeadForm({ email: "", password: "" });
      setShowCreateHead(false);
      router.refresh();
    } catch (err: any) {
      setHeadError(err.message ?? "Failed to create department head");
    } finally {
      setCreatingHead(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (isEdit) {
        const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${hasuraToken}`,
          },
          body: JSON.stringify({
            query: `
              mutation UpdateDepartment($id: uuid!, $set: departments_set_input!) {
                update_departments_by_pk(
                  pk_columns: { id: $id }
                  _set: $set
                ) { id name }
              }
            `,
            variables: {
              id:  initialData.id,
              set: {
                name:    form.name,
                head_id: form.head_id || null,
              },
            },
          }),
        });

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);

        setSuccess(true);
        router.refresh();

      } else {
        // Create department
        const res = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${hasuraToken}`,
          },
          body: JSON.stringify({
            query: `
              mutation CreateDepartment($object: departments_insert_input!) {
                insert_departments_one(object: $object) { id name }
              }
            `,
            variables: {
              object: {
                name:    form.name,
                head_id: form.head_id || null,
              },
            },
          }),
        });

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);

        // Update head user's department_id if selected
        if (form.head_id) {
          const newDeptId = json.data.insert_departments_one.id;
          await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${hasuraToken}`,
            },
            body: JSON.stringify({
              query: `
                mutation UpdateUserDept($userId: uuid!, $deptId: uuid!) {
                  update_users_by_pk(
                    pk_columns: { id: $userId }
                    _set: { department_id: $deptId }
                  ) { id }
                }
              `,
              variables: {
                userId: form.head_id,
                deptId: newDeptId,
              },
            }),
          });
        }

        router.push("/dashboard/admin/departments");
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

      {/* Main department form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6 mb-4"
      >
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
            Department saved successfully!
          </div>
        )}
        {headSuccess && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
            {headSuccess}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Engineering"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Head selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Department Head
              </label>
              {/* Toggle create head form */}
              {isEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateHead((v) => !v);
                    setHeadError("");
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showCreateHead ? "Cancel" : "+ Create new head"}
                </button>
              )}
            </div>

            <select
              name="head_id"
              value={form.head_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No head assigned —</option>
              {heads.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            {!isEdit && (
              <p className="text-xs text-gray-500 mt-1">
                Save the department first, then assign a head from the edit page.
              </p>
            )}
          </div>

        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Department"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/departments")}
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Create Head inline form — only shown on edit page */}
      {isEdit && showCreateHead && (
        <form
          onSubmit={handleCreateHead}
          className="bg-blue-50 border border-blue-200 rounded-lg p-5"
        >
          <h3 className="font-semibold text-blue-800 text-sm mb-3">
            Create New Department Head
          </h3>
          <p className="text-xs text-blue-600 mb-4">
            This will create a login account with role = department,
            linked to this department automatically, and email the credentials.
          </p>

          {headError && (
            <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded mb-3">
              {headError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={headForm.email}
                onChange={handleHeadFormChange}
                required
                placeholder="head@company.com"
                className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                name="password"
                value={headForm.password}
                onChange={handleHeadFormChange}
                required
                placeholder="Min 8 characters"
                className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
          </div>

          <p className="text-xs text-blue-600 mt-3">
            Share this password securely with the department head after creation.
          </p>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={creatingHead}
              className="bg-blue-600 text-white px-4 py-2 rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {creatingHead ? "Creating..." : "Create & Assign"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateHead(false);
                setHeadError("");
              }}
              className="border border-blue-300 text-blue-700 px-4 py-2 rounded text-xs hover:bg-blue-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}