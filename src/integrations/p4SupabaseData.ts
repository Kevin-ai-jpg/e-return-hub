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