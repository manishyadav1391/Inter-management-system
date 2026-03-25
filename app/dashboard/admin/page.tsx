import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

  // Fetch summary counts
  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        interns_aggregate {
          aggregate { count }
        }
        departments_aggregate {
          aggregate { count }
        }
        institutes_aggregate {
          aggregate { count }
        }
       active: interns_aggregate(
  where: { internship_status: { status: { _eq: "active" } } }
) {
          aggregate { count }
        }
      }
    `,
  });

  const totalInterns     = data.interns_aggregate.aggregate.count;
  const totalDepartments = data.departments_aggregate.aggregate.count;
  const totalInstitutes  = data.institutes_aggregate.aggregate.count;
  const activeInterns    = data.active.aggregate.count;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session.user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Total Interns"     value={totalInterns}     color="blue"   />
        <StatCard label="Active Interns"    value={activeInterns}    color="green"  />
        <StatCard label="Departments"       value={totalDepartments} color="purple" />
        <StatCard label="Institutes"        value={totalInstitutes}  color="amber"  />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <Link
            href="/dashboard/admin/interns/new"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            + Add Intern
          </Link>
          <Link
            href="/dashboard/admin/interns"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition"
          >
            View All Interns
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reusable stat card component
function StatCard({
  label, value, color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colors = {
    blue:   "bg-blue-50   text-blue-700",
    green:  "bg-green-50  text-green-700",
    purple: "bg-purple-50 text-purple-700",
    amber:  "bg-amber-50  text-amber-700",
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}