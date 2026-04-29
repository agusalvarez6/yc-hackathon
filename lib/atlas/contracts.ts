// Deterministic mock contract generator for the Atlas world view.
// Same seed (42) and same iteration order as the standalone prototype, so the
// output is stable across renders and across server/client boundaries.

import { CATEGORIES, COUNTRIES } from "./countries";

export type ContractStatus =
  | "Open for bids"
  | "Pre-solicitation"
  | "Awarded"
  | "Under review";

export interface AtlasContract {
  id: number;
  title: string;
  agency: string;
  country: string; // ISO-3
  countryName: string;
  region: string;
  category: string;
  categoryLabel: string;
  valueM: number;
  deadlineDays: number;
  status: ContractStatus;
  ref: string;
}

const TITLES = [
  "Cloud Migration & Modernization",
  "National Bridge Renovation",
  "Border Patrol Vehicle Fleet",
  "Public Hospital ERP Rollout",
  "Solar Microgrid Deployment",
  "Light Rail Extension Phase II",
  "Port Container Logistics Hub",
  "Strategic Procurement Audit",
  "Cybersecurity Operations Center",
  "Highway Resurfacing Programme",
  "Naval Surveillance Systems",
  "EHR Integration Initiative",
  "Wind Farm Construction Tender",
  "Federal Data Center Refresh",
  "Customs Modernization Program",
  "Digital Identity Platform",
  "Coastal Defense Infrastructure",
  "Urban Water Treatment Upgrade",
  "Public Schools WiFi Rollout",
  "Air Traffic Control Software",
  "Smart Metering Infrastructure",
  "Tax Authority Digital Services",
  "Logistics Command Platform",
  "Justice Case Management System",
  "Tunnel Boring & Excavation",
];

const AGENCIES = [
  "Ministry of Defense",
  "Department of Transportation",
  "Ministry of Health",
  "Department of Energy",
  "Public Works Authority",
  "Ministry of the Interior",
  "Tax & Customs Service",
  "Ministry of Education",
  "Federal Procurement Office",
  "Coast Guard",
  "Department of Justice",
  "Ministry of Digital Affairs",
];

const STATUSES: ContractStatus[] = [
  "Open for bids",
  "Pre-solicitation",
  "Awarded",
  "Under review",
];

const HEAVY = new Set([
  "USA", "CHN", "DEU", "FRA", "GBR", "JPN", "IND", "BRA", "CAN", "AUS",
  "ITA", "ESP", "KOR", "RUS", "SAU", "NLD", "ARE",
]);
const MED = new Set([
  "MEX", "ARG", "COL", "TUR", "POL", "SWE", "ZAF", "IDN", "NGA", "UKR",
  "NOR", "FIN",
]);

let cache: AtlasContract[] | null = null;

function generate(): AtlasContract[] {
  const contracts: AtlasContract[] = [];
  let id = 1;

  // Same LCG as the prototype. Stable seed so the layout never drifts.
  let seed = 42;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (const c of COUNTRIES) {
    const heavy = HEAVY.has(c.code);
    const med = MED.has(c.code);
    const count = heavy
      ? 6 + Math.floor(rnd() * 6)
      : med
        ? 3 + Math.floor(rnd() * 4)
        : 1 + Math.floor(rnd() * 3);

    for (let i = 0; i < count; i++) {
      const cat = CATEGORIES[Math.floor(rnd() * CATEGORIES.length)];
      const valueRange = heavy ? 80 : med ? 18 : 6;
      const value = Math.round((0.2 + rnd() * valueRange) * 10) / 10;
      const days = Math.floor(rnd() * 90) + 5;
      contracts.push({
        id: id++,
        title: TITLES[Math.floor(rnd() * TITLES.length)],
        agency: AGENCIES[Math.floor(rnd() * AGENCIES.length)],
        country: c.code,
        countryName: c.name,
        region: c.region,
        category: cat.id,
        categoryLabel: cat.label,
        valueM: value,
        deadlineDays: days,
        status: STATUSES[Math.floor(rnd() * STATUSES.length)],
        ref: `${c.code}-2026-${String(id).padStart(5, "0")}`,
      });
    }
  }

  return contracts;
}

export function getAtlasContracts(): AtlasContract[] {
  if (!cache) cache = generate();
  return cache;
}
