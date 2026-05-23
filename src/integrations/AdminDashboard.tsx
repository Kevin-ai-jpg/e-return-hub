import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, BarChart3, Leaf, Recycle, Ticket, Truck } from "lucide-react";
import {
  countyStats as mockCountyStats,
  dashboardKpis as mockDashboardKpis,
  monthlyTrend as mockMonthlyTrend,
  topCollectors as mockTopCollectors,
} from "../data/mockDashboardData";
import {
  fetchDashboardDataFromSupabase,
  type DashboardLiveData,
} from "./p4SupabaseData";

const currentKgPerPerson = 2.8;
const targetKgPerPerson = 4.0;
const progressPercent = Math.round(
  (currentKgPerPerson / targetKgPerPerson) * 100,
);

const mockDashboardData: DashboardLiveData = {
  dashboardKpis: mockDashboardKpis,
  countyStats: mockCountyStats,
  monthlyTrend: mockMonthlyTrend,
  topCollectors: mockTopCollectors,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Recycle;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-green-950">{value}</p>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-green-100 p-3 text-green-800">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [dashboardData, setDashboardData] =
    useState<DashboardLiveData>(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSourceMessage, setDataSourceMessage] = useState(
    "Loading dashboard data from Supabase...",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);

        const liveData = await fetchDashboardDataFromSupabase();

        if (!isMounted) return;

        const hasLiveData =
          liveData.dashboardKpis.totalCollections > 0 ||
          liveData.dashboardKpis.totalKgCollected > 0 ||
          liveData.dashboardKpis.vouchersIssued > 0;

        if (hasLiveData) {
          setDashboardData(liveData);
          setDataSourceMessage("Data source: Supabase live dashboard data");
        } else {
          setDashboardData(mockDashboardData);
          setDataSourceMessage(
            "No live dashboard rows found. Showing mock demo data.",
          );
        }
      } catch (err) {
        console.error("Failed to load dashboard data from Supabase:", err);

        if (!isMounted) return;

        setDashboardData(mockDashboardData);
        setDataSourceMessage(
          err instanceof Error
            ? `Supabase failed: ${err.message}. Showing mock demo data.`
            : "Supabase failed. Showing mock demo data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const { dashboardKpis, countyStats, monthlyTrend, topCollectors } =
    dashboardData;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-green-900 to-green-700 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          National e-waste collection overview
        </h1>
        <p className="mt-2 max-w-3xl text-green-50">
          County statistics, collector performance, voucher activity, and
          progress toward the 4kg/person annual target.
        </p>

        <p
          className={[
            "mt-4 inline-flex rounded-xl px-3 py-2 text-sm font-semibold",
            dataSourceMessage.includes("Supabase live")
              ? "bg-white/15 text-white"
              : "bg-yellow-100 text-yellow-900",
          ].join(" ")}
        >
          {isLoading ? "Loading dashboard data from Supabase..." : dataSourceMessage}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total collections"
          value={formatNumber(dashboardKpis.totalCollections)}
          subtitle="Confirmed pickups and drop-offs"
          icon={Recycle}
        />
        <KpiCard
          title="Kg collected"
          value={`${formatNumber(dashboardKpis.totalKgCollected)} kg`}
          subtitle="Across active counties"
          icon={Truck}
        />
        <KpiCard
          title="Vouchers issued"
          value={formatNumber(dashboardKpis.vouchersIssued)}
          subtitle="Generated after confirmation"
          icon={Ticket}
        />
        <KpiCard
          title="CO₂ avoided"
          value={`${formatNumber(dashboardKpis.co2AvoidedKg)} kg`}
          subtitle="Estimated environmental impact"
          icon={Leaf}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-green-950">
                Collection by county
              </h2>
              <p className="text-sm text-gray-600">
                Kg collected per county.
              </p>
            </div>
            <BarChart3 className="text-green-800" />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="county" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="kgCollected"
                  name="Kg collected"
                  fill="#4CAF50"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-green-950">
            4kg/person target
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Demo progress toward the annual collection target.
          </p>

          <div className="mt-8 text-center">
            <p className="text-5xl font-bold text-green-900">
              {currentKgPerPerson}
              <span className="text-2xl text-gray-500">
                /{targetKgPerPerson}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-600">kg/person/year</p>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span className="text-green-900">{progressPercent}% reached</span>
              <span className="text-gray-500">Target: 4kg</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-green-100">
              <div
                className="h-full rounded-full bg-green-600"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-green-950">
            Monthly collection trend
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Growth in collected e-waste after marketplace launch.
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kgCollected"
                  name="Kg collected"
                  stroke="#1B5E20"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-green-950">
                Top collectors
              </h2>
              <p className="text-sm text-gray-600">
                Company leaderboard by collected kilograms.
              </p>
            </div>
            <Award className="text-green-800" />
          </div>

          <div className="overflow-hidden rounded-xl border border-green-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-green-50 text-green-950">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Kg</th>
                  <th className="px-4 py-3 font-semibold">Pickups</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Vouchers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {topCollectors.map((collector) => (
                  <tr key={collector.companyName} className="bg-white">
                    <td className="px-4 py-3 font-medium text-green-950">
                      {collector.companyName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatNumber(collector.totalKgCollected)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {collector.collections}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      ⭐ {collector.rating.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatNumber(collector.vouchersLei)} lei
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}