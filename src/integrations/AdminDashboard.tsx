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
import { Award, BarChart3, Building2, Leaf, Loader2, Map, Recycle, Ticket, Truck, UserPlus } from "lucide-react";
import { AddCollectorSection } from "./AddCollectorSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionMap } from "./CollectionMap";
import {
  fetchDashboardDataFromSupabase,
  type DashboardLiveData,
} from "./p4SupabaseData";

const TARGET_KG_PER_PERSON = 4.0;

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

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: DashboardLiveData };

export function AdminDashboard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    fetchDashboardDataFromSupabase()
      .then((data) => {
        if (isMounted) setState({ status: "ok", data });
      })
      .catch((err) => {
        if (isMounted)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : String(err),
          });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-800" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <p className="font-bold">Failed to load dashboard data</p>
        <p className="mt-2 text-sm">{state.message}</p>
      </div>
    );
  }

  const { dashboardKpis, countyStats, monthlyTrend, topCollectors } = state.data;

  const kgPerPerson = 2.8;
  const progressPercent = Math.round((kgPerPerson / TARGET_KG_PER_PERSON) * 100);

  const hasCollections = dashboardKpis.totalCollections > 0;

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
          progress toward the 4 kg/person annual target.
        </p>
        <span className="mt-4 inline-flex rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white">
          Live data · Supabase
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Active collectors"
          value={formatNumber(dashboardKpis.activeCollectors)}
          subtitle="Licensed companies in Supabase"
          icon={Building2}
        />
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-1.5 h-4 w-4" />
            Collection Map
          </TabsTrigger>
          <TabsTrigger value="add-collector">
            <UserPlus className="mr-1.5 h-4 w-4" />
            Add Collector
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-2">
          {!hasCollections ? (
            <div className="rounded-2xl border border-green-100 bg-white p-10 text-center shadow-sm">
              <Recycle className="mx-auto h-10 w-10 text-green-300" />
              <p className="mt-4 text-lg font-semibold text-green-950">
                No collections yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Charts and leaderboard will appear once collection data is recorded
                in Supabase.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-green-950">
                        Collection by county
                      </h2>
                      <p className="text-sm text-gray-600">Kg collected per county.</p>
                    </div>
                    <BarChart3 className="text-green-800" />
                  </div>
                  {(() => {
                    const data = countyStats;

                    if (data.length === 0) {
                      return (
                        <div className="flex h-80 items-center justify-center text-sm text-gray-500">
                          No county data available yet.
                        </div>
                      );
                    }
                    return (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="county" interval={0} angle={-25} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="kgCollected"
                              name="Kg collected"
                              fill="#4CAF50"
                              maxBarSize={64}
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-green-950">
                    4 kg/person target
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Progress toward the annual collection target.
                  </p>
                  <div className="mt-8 text-center">
                    <p className="text-5xl font-bold text-green-900">
                      {kgPerPerson}
                      <span className="text-2xl text-gray-500">
                        /{TARGET_KG_PER_PERSON}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">kg/person/year</p>
                  </div>
                  <div className="mt-8">
                    <div className="mb-2 flex justify-between text-sm font-medium">
                      <span className="text-green-900">{progressPercent}% reached</span>
                      <span className="text-gray-500">Target: 4 kg</span>
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
                    Growth in collected e-waste over time.
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
            </>
          )}
        </TabsContent>

        <TabsContent value="map" className="pt-2">
          <CollectionMap height="560px" useSupabaseData />
        </TabsContent>

        <TabsContent value="add-collector" className="pt-2">
          <AddCollectorSection />
        </TabsContent>
      </Tabs>
    </section>
  );
}
