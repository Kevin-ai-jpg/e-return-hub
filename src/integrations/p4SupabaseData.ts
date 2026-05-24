import { supabase } from "./supabase/client";
import type {
  CollectionPoint,
  PickupMethod,
} from "../data/mockCollectionPoints";

type DbRow = Record<string, unknown>;

const companyColors = [
  "#1B5E20",
  "#4CAF50",
  "#2E7D32",
  "#66BB6A",
  "#00A86B",
  "#388E3C",
];

function toString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizePickupMethod(value: unknown): PickupMethod {
  const text = String(value ?? "").toLowerCase();

  if (text.includes("both")) return "both";
  if (text.includes("home")) return "home";
  if (text.includes("drop")) return "dropoff";

  return "dropoff";
}

const COUNTY_PATTERNS: [RegExp, string][] = [
  [/alba/i, "Alba"],
  [/arad/i, "Arad"],
  [/arge[sș]/i, "Argeș"],
  [/bac[aă]u/i, "Bacău"],
  [/bihor/i, "Bihor"],
  [/bistri[tț]a|n[aă]s[aă]ud/i, "Bistrița-Năsăud"],
  [/boto[sș]ani/i, "Botoșani"],
  [/br[aă]ila/i, "Brăila"],
  [/bra[sș]ov/i, "Brașov"],
  [/bucure[sș]ti|bucurești/i, "București"],
  [/buz[aă]u/i, "Buzău"],
  [/c[aă]l[aă]ra[sș]i/i, "Călărași"],
  [/cara[sș].severin|re[sș]i[tț]a|caransebe[sș]/i, "Caraș-Severin"],
  [/cluj|napoca/i, "Cluj"],
  [/constan[tț]a/i, "Constanța"],
  [/covasna|sf[aâ]ntu gheorghe/i, "Covasna"],
  [/d[aâ]mbovi[tț]a|t[aâ]rgovi[sș]te/i, "Dâmbovița"],
  [/dolj|craiova/i, "Dolj"],
  [/gala[tț]i/i, "Galați"],
  [/giurgiu/i, "Giurgiu"],
  [/gorj|t[aâ]rgu jiu/i, "Gorj"],
  [/harghita|miercurea/i, "Harghita"],
  [/hunedoara|deva|petro[sș]ani/i, "Hunedoara"],
  [/ialomi[tț]a|slobozia/i, "Ialomița"],
  [/ia[sș]i/i, "Iași"],
  [/ilfov/i, "Ilfov"],
  [/maramure[sș]|baia mare/i, "Maramureș"],
  [/mehedin[tț]i|drobeta/i, "Mehedinți"],
  [/mure[sș]|t[aâ]rgu mure[sș]/i, "Mureș"],
  [/neam[tț]|piatra neam[tț]/i, "Neamț"],
  [/olt|slatina/i, "Olt"],
  [/prahova|ploie[sș]ti/i, "Prahova"],
  [/s[aă]laj|zal[aă]u/i, "Sălaj"],
  [/satu mare|carei/i, "Satu Mare"],
  [/sibiu|hermannstadt/i, "Sibiu"],
  [/suceava|f[aă]lticeni/i, "Suceava"],
  [/teleorman|alexandria/i, "Teleorman"],
  [/timi[sș]|timi[sș]oara/i, "Timiș"],
  [/tulcea/i, "Tulcea"],
  [/vaslui|b[aâ]rlad/i, "Vaslui"],
  [/v[aâ]lcea|r[aâ]mnicu/i, "Vâlcea"],
  [/vrancea|focsani|focșani/i, "Vrancea"],
];

function inferCountyFromAddress(address: string): string {
  for (const [pattern, county] of COUNTY_PATTERNS) {
    if (pattern.test(address)) return county;
  }
  return "Unknown";
}

export async function fetchCollectionPointsFromSupabase(): Promise<
  CollectionPoint[]
> {
  const { data: pointRows, error: pointsError } = await supabase
    .from("collection_points")
    .select("id, collector_id, name, lat, lng, deee_types, schedule, address");

  if (pointsError) {
    throw new Error(pointsError.message);
  }

  const points = (pointRows ?? []) as DbRow[];

  const collectorIds = Array.from(
    new Set(
      points
        .map((point) => toString(point.collector_id))
        .filter((id) => id.length > 0),
    ),
  );

  const { data: collectorRows, error: collectorsError } = collectorIds.length
    ? await supabase
        .from("collectors")
        .select("id, company_name, rating, pickup_methods")
        .in("id", collectorIds)
    : { data: [], error: null };

  if (collectorsError) {
    throw new Error(collectorsError.message);
  }

  const collectors = new Map<string, DbRow>();

  ((collectorRows ?? []) as DbRow[]).forEach((collector) => {
    collectors.set(toString(collector.id), collector);
  });

  return points.map((point, index) => {
    const collector = collectors.get(toString(point.collector_id));

    const address = toString(point.address, "Address unavailable");
    const companyName = toString(
      collector?.company_name,
      "Unknown Collector",
    );

    return {
      id: toString(point.id, `collection-point-${index}`),
      collectorId: toString(point.collector_id) || null,
      name: toString(point.name, `${companyName} Collection Point`),
      companyName,
      companyColor: companyColors[index % companyColors.length],
      lat: toNumber(point.lat),
      lng: toNumber(point.lng),
      address,
      county: inferCountyFromAddress(address),
      deeeTypes: toStringArray(point.deee_types),
      schedule: toString(point.schedule, "Schedule unavailable"),
      pickupMethods: normalizePickupMethod(collector?.pickup_methods),
      rating: toNumber(collector?.rating, 4.5),
    };
  });
}

export type DashboardKpis = {
  totalCollections: number;
  totalKgCollected: number;
  vouchersIssued: number;
  activeCollectors: number;
  co2AvoidedKg: number;
};

export type CountyStat = {
  county: string;
  kgCollected: number;
  collections: number;
};

export type MonthlyTrendPoint = {
  month: string;
  kgCollected: number;
};

export type TopCollector = {
  companyName: string;
  totalKgCollected: number;
  collections: number;
  rating: number;
  vouchersLei: number;
};

export type DashboardLiveData = {
  dashboardKpis: DashboardKpis;
  countyStats: CountyStat[];
  monthlyTrend: MonthlyTrendPoint[];
  topCollectors: TopCollector[];
};

function getMonthInfo(dateValue: unknown) {
  const date =
    typeof dateValue === "string" || typeof dateValue === "number"
      ? new Date(dateValue)
      : null;

  if (!date || Number.isNaN(date.getTime())) {
    return { key: "0000-00", label: "Unknown" };
  }

  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
  return { key, label };
}

export async function fetchDashboardDataFromSupabase(): Promise<DashboardLiveData> {
  const [
    collectionsResult,
    pickupRequestsResult,
    vouchersResult,
    collectorsResult,
    usersResult,
  ] = await Promise.all([
    supabase
      .from("collections")
      .select("id, pickup_request_id, confirmed_at, kg_collected"),
    supabase
      .from("pickup_requests")
      .select("id, collector_id, address, status, created_at, user_id"),
    supabase.from("vouchers").select("id, value_lei, status, created_at"),
    supabase.from("collectors").select("id, company_name, rating"),
    supabase.from("users").select("id, county"),
  ]);

  if (collectionsResult.error) {
    throw new Error(collectionsResult.error.message);
  }

  if (pickupRequestsResult.error) {
    throw new Error(pickupRequestsResult.error.message);
  }

  if (vouchersResult.error) {
    throw new Error(vouchersResult.error.message);
  }

  if (collectorsResult.error) {
    throw new Error(collectorsResult.error.message);
  }
  const collections = (collectionsResult.data ?? []) as DbRow[];
  const pickupRequests = (pickupRequestsResult.data ?? []) as DbRow[];
  const vouchers = (vouchersResult.data ?? []) as DbRow[];
  const collectors = (collectorsResult.data ?? []) as DbRow[];
  const users = (usersResult.data ?? []) as DbRow[];

  const userCountyById = new Map<string, string>();
  users.forEach((u) => {
    if (u.id && u.county) userCountyById.set(toString(u.id), toString(u.county));
  });

  const pickupRequestById = new Map<string, DbRow>();

  pickupRequests.forEach((request) => {
    pickupRequestById.set(toString(request.id), request);
  });

  const collectorById = new Map<string, DbRow>();

  collectors.forEach((collector) => {
    collectorById.set(toString(collector.id), collector);
  });

  const totalKgCollected = collections.reduce(
    (sum, collection) => sum + toNumber(collection.kg_collected),
    0,
  );

  const countyMap = new Map<string, CountyStat>();
  const monthMap = new Map<string, MonthlyTrendPoint>();
  const collectorStatsMap = new Map<string, TopCollector>();

  collections.forEach((collection) => {
    const kg = toNumber(collection.kg_collected);
    const pickupRequest = pickupRequestById.get(
      toString(collection.pickup_request_id),
    );

    const userId = toString(pickupRequest?.user_id);
    const countyFromUser = userCountyById.get(userId) ?? "";
    const address = toString(pickupRequest?.address);
    const county =
      countyFromUser || inferCountyFromAddress(address) || "Unknown";

    const existingCounty = countyMap.get(county) ?? {
      county,
      kgCollected: 0,
      collections: 0,
    };

    existingCounty.kgCollected += kg;
    existingCounty.collections += 1;
    countyMap.set(county, existingCounty);

    const monthInfo = getMonthInfo(collection.confirmed_at);
    const existingMonth = monthMap.get(monthInfo.key) ?? {
      month: monthInfo.label,
      kgCollected: 0,
    };

    existingMonth.kgCollected += kg;
    monthMap.set(monthInfo.key, existingMonth);

    const collectorId = toString(pickupRequest?.collector_id);
    const collector = collectorById.get(collectorId);

    const companyName = toString(
      collector?.company_name,
      "Unknown Collector",
    );

    const existingCollector = collectorStatsMap.get(collectorId) ?? {
      companyName,
      totalKgCollected: 0,
      collections: 0,
      rating: toNumber(collector?.rating, 4.5),
      vouchersLei: 0,
    };

    existingCollector.totalKgCollected += kg;
    existingCollector.collections += 1;
    collectorStatsMap.set(collectorId, existingCollector);
  });

  const totalVoucherLei = vouchers.reduce(
    (sum, voucher) => sum + toNumber(voucher.value_lei),
    0,
  );

  const topCollectors = Array.from(collectorStatsMap.values())
    .map((collector) => {
      const share =
        totalKgCollected > 0
          ? collector.totalKgCollected / totalKgCollected
          : 0;

      return {
        ...collector,
        vouchersLei: Math.round(totalVoucherLei * share),
      };
    })
    .sort((a, b) => b.totalKgCollected - a.totalKgCollected)
    .slice(0, 5);

  return {
    dashboardKpis: {
      totalCollections: collections.length,
      totalKgCollected,
      vouchersIssued: vouchers.length,
      activeCollectors: collectors.length,
      co2AvoidedKg: Math.round(totalKgCollected * 2.5),
    },
    countyStats: Array.from(countyMap.values())
      .sort((a, b) => b.kgCollected - a.kgCollected)
      .slice(0, 10),
    monthlyTrend: Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value),
    topCollectors,
  };
}