// Country, category, and region constants for the marketplace globe + heatmap.
// Ported verbatim from the standalone Lyra Marketplace prototype.

export type Region =
  | "North America"
  | "South America"
  | "Europe"
  | "Middle East"
  | "Africa"
  | "Asia"
  | "Oceania";

export interface Country {
  code: string; // ISO-3
  name: string;
  lat: number;
  lng: number;
  region: Region;
  radius: number;
  shape?: "wide" | "tall";
}

export interface Category {
  id: string;
  label: string;
  hue: number;
}

export const COUNTRIES: Country[] = [
  { code: "USA", name: "United States",     lat: 39.8,  lng: -98.6, region: "North America", radius: 22, shape: "wide" },
  { code: "CAN", name: "Canada",            lat: 56.1,  lng: -106.3, region: "North America", radius: 22, shape: "wide" },
  { code: "MEX", name: "Mexico",            lat: 23.6,  lng: -102.5, region: "North America", radius: 12 },
  { code: "BRA", name: "Brazil",            lat: -10.0, lng: -53.0,  region: "South America", radius: 16 },
  { code: "ARG", name: "Argentina",         lat: -34.0, lng: -64.0,  region: "South America", radius: 12, shape: "tall" },
  { code: "COL", name: "Colombia",          lat: 4.0,   lng: -73.0,  region: "South America", radius: 7 },
  { code: "CHL", name: "Chile",             lat: -35.7, lng: -71.5,  region: "South America", radius: 10, shape: "tall" },
  { code: "PER", name: "Peru",              lat: -9.2,  lng: -75.0,  region: "South America", radius: 8 },

  { code: "GBR", name: "United Kingdom",    lat: 54.3,  lng: -2.4,   region: "Europe",        radius: 5, shape: "tall" },
  { code: "FRA", name: "France",            lat: 46.6,  lng: 2.2,    region: "Europe",        radius: 6 },
  { code: "DEU", name: "Germany",           lat: 51.1,  lng: 10.4,   region: "Europe",        radius: 5 },
  { code: "ESP", name: "Spain",             lat: 40.0,  lng: -3.7,   region: "Europe",        radius: 6 },
  { code: "ITA", name: "Italy",             lat: 42.5,  lng: 12.5,   region: "Europe",        radius: 6, shape: "tall" },
  { code: "POL", name: "Poland",            lat: 51.9,  lng: 19.1,   region: "Europe",        radius: 5 },
  { code: "SWE", name: "Sweden",            lat: 62.0,  lng: 16.0,   region: "Europe",        radius: 7, shape: "tall" },
  { code: "NOR", name: "Norway",            lat: 64.0,  lng: 10.0,   region: "Europe",        radius: 7, shape: "tall" },
  { code: "FIN", name: "Finland",           lat: 64.0,  lng: 26.0,   region: "Europe",        radius: 6, shape: "tall" },
  { code: "UKR", name: "Ukraine",           lat: 49.0,  lng: 32.0,   region: "Europe",        radius: 7 },
  { code: "ROU", name: "Romania",           lat: 45.9,  lng: 24.9,   region: "Europe",        radius: 4 },
  { code: "GRC", name: "Greece",            lat: 39.0,  lng: 22.0,   region: "Europe",        radius: 4 },
  { code: "PRT", name: "Portugal",          lat: 39.4,  lng: -8.2,   region: "Europe",        radius: 4, shape: "tall" },
  { code: "NLD", name: "Netherlands",       lat: 52.1,  lng: 5.3,    region: "Europe",        radius: 3 },
  { code: "IRL", name: "Ireland",           lat: 53.4,  lng: -8.2,   region: "Europe",        radius: 4 },

  { code: "RUS", name: "Russia",            lat: 61.5,  lng: 95.0,   region: "Europe",        radius: 30, shape: "wide" },
  { code: "TUR", name: "Türkiye",           lat: 39.0,  lng: 35.2,   region: "Middle East",   radius: 8, shape: "wide" },
  { code: "SAU", name: "Saudi Arabia",      lat: 24.0,  lng: 45.0,   region: "Middle East",   radius: 11 },
  { code: "ARE", name: "UAE",               lat: 24.0,  lng: 54.0,   region: "Middle East",   radius: 4 },
  { code: "ISR", name: "Israel",            lat: 31.0,  lng: 35.0,   region: "Middle East",   radius: 3 },
  { code: "IRN", name: "Iran",              lat: 32.4,  lng: 53.7,   region: "Middle East",   radius: 10 },
  { code: "EGY", name: "Egypt",             lat: 26.8,  lng: 30.8,   region: "Africa",        radius: 8 },
  { code: "MAR", name: "Morocco",           lat: 31.8,  lng: -7.1,   region: "Africa",        radius: 6 },
  { code: "DZA", name: "Algeria",           lat: 28.0,  lng: 1.7,    region: "Africa",        radius: 10 },
  { code: "NGA", name: "Nigeria",           lat: 9.0,   lng: 8.7,    region: "Africa",        radius: 7 },
  { code: "KEN", name: "Kenya",             lat: 0.0,   lng: 37.9,   region: "Africa",        radius: 6 },
  { code: "ETH", name: "Ethiopia",          lat: 9.1,   lng: 40.5,   region: "Africa",        radius: 7 },
  { code: "ZAF", name: "South Africa",      lat: -30.6, lng: 22.9,   region: "Africa",        radius: 8 },

  { code: "IND", name: "India",             lat: 22.0,  lng: 78.9,   region: "Asia",          radius: 12 },
  { code: "PAK", name: "Pakistan",          lat: 30.4,  lng: 69.3,   region: "Asia",          radius: 7 },
  { code: "CHN", name: "China",             lat: 35.9,  lng: 104.2,  region: "Asia",          radius: 18, shape: "wide" },
  { code: "JPN", name: "Japan",             lat: 36.2,  lng: 138.3,  region: "Asia",          radius: 6, shape: "tall" },
  { code: "KOR", name: "South Korea",       lat: 35.9,  lng: 127.8,  region: "Asia",          radius: 4 },
  { code: "VNM", name: "Vietnam",           lat: 14.1,  lng: 108.3,  region: "Asia",          radius: 5, shape: "tall" },
  { code: "THA", name: "Thailand",          lat: 15.9,  lng: 100.99, region: "Asia",          radius: 5 },
  { code: "IDN", name: "Indonesia",         lat: -2.5,  lng: 118.0,  region: "Asia",          radius: 13, shape: "wide" },
  { code: "PHL", name: "Philippines",       lat: 12.9,  lng: 121.8,  region: "Asia",          radius: 5 },
  { code: "MYS", name: "Malaysia",          lat: 4.2,   lng: 101.9,  region: "Asia",          radius: 5 },
  { code: "KAZ", name: "Kazakhstan",        lat: 48.0,  lng: 66.9,   region: "Asia",          radius: 13, shape: "wide" },

  { code: "AUS", name: "Australia",         lat: -25.3, lng: 133.8,  region: "Oceania",       radius: 16, shape: "wide" },
  { code: "NZL", name: "New Zealand",       lat: -41.0, lng: 174.0,  region: "Oceania",       radius: 5, shape: "tall" },
];

export const CATEGORIES: Category[] = [
  { id: "software",     label: "Software & IT",        hue: 215 },
  { id: "construction", label: "Construction",         hue: 30  },
  { id: "defense",      label: "Defense",              hue: 0   },
  { id: "healthcare",   label: "Healthcare",           hue: 160 },
  { id: "energy",       label: "Energy & Utilities",   hue: 50  },
  { id: "infra",        label: "Infrastructure",       hue: 280 },
  { id: "logistics",    label: "Logistics",            hue: 195 },
  { id: "consulting",   label: "Consulting",           hue: 320 },
];

export const REGIONS: Region[] = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia",
  "Oceania",
];

export const COUNTRY_BY_CODE: Record<string, Country> = COUNTRIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<string, Country>,
);

export const CATEGORY_BY_ID: Record<string, Category> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, Category>,
);
