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

function inferCountyFromAddress(address: string) {
  const lower = address.toLowerCase();

  if (lower.includes("cluj")) return "Cluj";
  if (lower.includes("satu mare")) return "Satu Mare";
  if (lower.includes("timiș") || lower.includes("timis")) return "Timiș";
  if (lower.includes("bihor")) return "Bihor";

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

function getMonthLabel(dateValue: unknown) {
  const date =
    typeof dateValue === "string" || typeof dateValue === "number"
      ? new Date(dateValue)
      : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-US", { month: "short" });
}

export async function fetchDashboardDataFromSupabase(): Promise<DashboardLiveData> {
  const [
    collectionsResult,
    pickupRequestsResult,
    vouchersResult,
    collectorsResult,
  ] = await Promise.all([
    supabase
      .from("collections")
      .select("id, pickup_request_id, confirmed_at, kg_collected"),
    supabase
      .from("pickup_requests")
      .select("id, collector_id, address, status, created_at"),
    supabase.from("vouchers").select("id, value_lei, status, created_at"),
    supabase.from("collectors").select("id, company_name, rating"),
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

    const address = toString(pickupRequest?.address);
    const county = inferCountyFromAddress(address);

    const existingCounty = countyMap.get(county) ?? {
      county,
      kgCollected: 0,
      collections: 0,
    };

    existingCounty.kgCollected += kg;
    existingCounty.collections += 1;
    countyMap.set(county, existingCounty);

    const month = getMonthLabel(collection.confirmed_at);
    const existingMonth = monthMap.get(month) ?? {
      month,
      kgCollected: 0,
    };

    existingMonth.kgCollected += kg;
    monthMap.set(month, existingMonth);

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
    countyStats: Array.from(countyMap.values()).sort(
      (a, b) => b.kgCollected - a.kgCollected,
    ),
    monthlyTrend: Array.from(monthMap.values()),
    topCollectors,
  };
}