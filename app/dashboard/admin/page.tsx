import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import AdminOverviewCharts from "@/app/components/AdminOverviewCharts";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

  // Fetch summary counts
  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        interns_aggregate(where: { deleted_at: { _is_null: true } }) {
          aggregate { count }
        }
        departments_aggregate(where: { deleted_at: { _is_null: true } }) {
          aggregate { count }
        }
        institutes_aggregate(where: { deleted_at: { _is_null: true } }) {
          aggregate { count }
        }
        interns(where: { deleted_at: { _is_null: true } }) {
          department { name }
          internship_status { status }
        }
       active: interns_aggregate(
    where: {
      deleted_at: { _is_null: true }
      internship_status: { status: { _eq: "active" } }
    }
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

  const interns = data.interns ?? [];

  const statusMap = new Map<string, number>();
  const departmentMap = new Map<string, number>();

  for (const intern of interns) {
    const status = intern.internship_status?.status ?? "unknown";
    const dept = intern.department?.name ?? "Unassigned";

    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    departmentMap.set(dept, (departmentMap.get(dept) ?? 0) + 1);
  }

  const statusLabels = Array.from(statusMap.keys());
  const statusCounts = Array.from(statusMap.values());

  const sortedDepartments = Array.from(departmentMap.entries()).sort((a, b) => b[1] - a[1]);
  const departmentLabels = sortedDepartments.map(([name]) => name);
  const departmentCounts = sortedDepartments.map(([, count]) => count);

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

      <AdminOverviewCharts
        statusLabels={statusLabels}
        statusCounts={statusCounts}
        departmentLabels={departmentLabels}
        departmentCounts={departmentCounts}
      />
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