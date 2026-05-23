export type PickupMethod = "home" | "dropoff" | "both";

export type CollectionPoint = {
  id: string;
  collectorId?: string | null;
  name: string;
  companyName: string;
  companyColor: string;
  lat: number;
  lng: number;
  address: string;
  county: string;
  deeeTypes: string[];
  schedule: string;
  pickupMethods: PickupMethod;
  rating: number;
};

export const mockCollectionPoints: CollectionPoint[] = [
  {
    id: "cp-1",
    name: "EcoCollect Cluj Center",
    companyName: "EcoCollect",
    companyColor: "#1B5E20",
    lat: 46.7704,
    lng: 23.5899,
    address: "Piața Unirii, Cluj-Napoca",
    county: "Cluj",
    deeeTypes: ["fridge", "phone", "laptop", "TV"],
    schedule: "Mon-Fri 09:00-17:00",
    pickupMethods: "both",
    rating: 4.2,
  },
  {
    id: "cp-2",
    name: "GreenTech Cluj Hub",
    companyName: "GreenTech",
    companyColor: "#4CAF50",
    lat: 46.7869,
    lng: 23.6135,
    address: "Strada Fabricii, Cluj-Napoca",
    county: "Cluj",
    deeeTypes: ["phone", "laptop", "TV"],
    schedule: "Mon-Sat 10:00-18:00",
    pickupMethods: "home",
    rating: 4.8,
  },
  {
    id: "cp-3",
    name: "RecyclaPro Cluj Drop-off",
    companyName: "RecyclaPro",
    companyColor: "#2E7D32",
    lat: 46.7547,
    lng: 23.5982,
    address: "Calea Turzii, Cluj-Napoca",
    county: "Cluj",
    deeeTypes: ["fridge", "phone", "laptop", "TV", "printer"],
    schedule: "Daily 08:00-20:00",
    pickupMethods: "dropoff",
    rating: 4.9,
  },
  {
    id: "cp-4",
    name: "SmartWaste Satu Mare",
    companyName: "SmartWaste",
    companyColor: "#66BB6A",
    lat: 47.7904,
    lng: 22.8726,
    address: "Centrul Nou, Satu Mare",
    county: "Satu Mare",
    deeeTypes: ["fridge", "TV", "laptop"],
    schedule: "Mon-Fri 08:30-16:30",
    pickupMethods: "both",
    rating: 3.8,
  },
  {
    id: "cp-5",
    name: "EcoCollect Satu Mare Point",
    companyName: "EcoCollect",
    companyColor: "#1B5E20",
    lat: 47.7996,
    lng: 22.8915,
    address: "Strada Botizului, Satu Mare",
    county: "Satu Mare",
    deeeTypes: ["phone", "laptop", "TV", "printer"],
    schedule: "Mon-Sat 09:00-18:00",
    pickupMethods: "dropoff",
    rating: 4.2,
  },
];