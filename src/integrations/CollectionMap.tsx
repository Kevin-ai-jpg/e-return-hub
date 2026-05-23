import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Clock, MapPin, Recycle, Star } from "lucide-react";
import {
  CollectionPoint,
  mockCollectionPoints,
} from "../data/mockCollectionPoints";

type CollectionMapProps = {
  points?: CollectionPoint[];
  selectedDeeeType?: string;
  height?: string;
};

function createCompanyIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 9999px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function formatPickupMethod(method: CollectionPoint["pickupMethods"]) {
  if (method === "home") return "Home pickup";
  if (method === "dropoff") return "Drop-off only";
  return "Home pickup + drop-off";
}

export function CollectionMap({
  points = mockCollectionPoints,
  selectedDeeeType = "all",
  height = "420px",
}: CollectionMapProps) {
  const filteredPoints =
    selectedDeeeType === "all"
      ? points
      : points.filter((point) => point.deeeTypes.includes(selectedDeeeType));

  return (
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-bold text-green-900">
          Collection Points Map
        </h2>
        <p className="text-sm text-gray-600">
          Colored pins show nearby licensed collectors and drop-off locations.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-green-100"
        style={{ height }}
      >
        <MapContainer
          center={[47.2, 23.15]}
          zoom={7}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={createCompanyIcon(point.companyColor)}
            >
              <Popup>
                <div className="min-w-[220px] space-y-2">
                  <div>
                    <p className="text-base font-bold text-green-900">
                      {point.name}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {point.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Star size={14} className="text-yellow-500" />
                    <span>{point.rating.toFixed(1)} rating</span>
                  </div>

                  <div className="flex items-start gap-1 text-sm text-gray-700">
                    <MapPin size={14} className="mt-0.5 text-green-700" />
                    <span>{point.address}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Clock size={14} className="text-green-700" />
                    <span>{point.schedule}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Recycle size={14} className="text-green-700" />
                    <span>{formatPickupMethod(point.pickupMethods)}</span>
                  </div>

                  <div className="pt-1">
                    <p className="mb-1 text-xs font-semibold text-gray-500">
                      Accepted DEEE types
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {point.deeeTypes.map((type: string) => (
                        <span
                          key={type}
                          className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-800"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filteredPoints.map((point) => (
          <div
            key={point.id}
            className="rounded-xl border border-green-100 bg-green-50/50 p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: point.companyColor }}
              />
              <p className="font-semibold text-green-900">{point.name}</p>
            </div>
            <p className="mt-1 text-sm text-gray-600">{point.address}</p>
            <p className="mt-1 text-sm text-gray-700">
              {formatPickupMethod(point.pickupMethods)} · ⭐{" "}
              {point.rating.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}