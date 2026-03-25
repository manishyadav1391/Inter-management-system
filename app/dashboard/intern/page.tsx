import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import InternProfileForm from "@/app/components/InternProfileForm";

export default async function InternDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "intern") redirect("/dashboard/admin");

  const hasuraToken = (session as any).hasuraToken;
  const email       = session.user?.email;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        interns {
          id name gender phone
          start_date end_date
          internship_status { status }
          department        { name   }
          institute         { name   }
        }
      }
    `,
  });

  const intern = data.interns[0];

  // No profile yet
  if (!intern) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">?</span>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-1">
            Profile not set up yet
          </p>
          <p className="text-sm text-gray-500">
            Contact your admin or department head to create your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-xl font-bold text-blue-700">
            {intern.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{intern.name}</h1>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          intern.internship_status?.status === "active"
            ? "bg-green-100 text-green-700"
            : intern.internship_status?.status === "completed"
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-600"
        }`}>
          {intern.internship_status?.status ?? "—"}
        </span>
      </div>

      {/* Read-only info card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">
          Internship Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Department" value={intern.department?.name} />
          <InfoRow label="Institute"  value={intern.institute?.name}  />
          <InfoRow label="Start Date" value={intern.start_date}       />
          <InfoRow label="End Date"   value={intern.end_date}         />
        </div>
      </div>

      {/* Editable info card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">
          Edit Your Details
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          You can update your name, phone number, and gender.
        </p>
        <InternProfileForm intern={intern} hasuraToken={hasuraToken} />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="border-b border-gray-100 pb-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="font-medium text-gray-800">{value ?? "—"}</p>
    </div>
  );
}