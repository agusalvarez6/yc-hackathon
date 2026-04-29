"use client";

/* Globe.tsx — full-bleed 3D globe with REAL country borders + contract markers.
   Slow rotation, drag/zoom (correct directions), hover tooltip, click-to-filter.
   Draw loop is FULLY decoupled from React state via refs — no flicker.
   Ported from the standalone Tender Express Atlas prototype. */

import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { COUNTRY_BY_CODE } from "@/lib/atlas/countries";
import { M49_TO_A3 } from "@/lib/atlas/iso-map";
import type { AtlasContract } from "@/lib/atlas/contracts";
import "./globe.css";

const DEG = Math.PI / 180;

// ---------- TopoJSON decoding ----------

type Vec3 = [number, number, number];
type Coord = [number, number]; // [lng, lat]

interface TopoArcs {
  scale: [number, number];
  translate: [number, number];
}
interface TopoGeometry {
  type: "Polygon" | "MultiPolygon" | string;
  id?: string | number;
  arcs: number[][] | number[][][];
  properties?: { name?: string };
}
interface TopoJson {
  transform: TopoArcs;
  arcs: number[][][];
  objects: Record<string, { geometries: TopoGeometry[] }>;
}

interface CountryFeature {
  id: string | number | undefined;
  name: string | undefined;
  polygons: Coord[][][]; // polygon[ring[point]]
  a3: string | null;
}

function topoFeature(topo: TopoJson, objName: string): CountryFeature[] {
  const obj = topo.objects[objName];
  const tx = topo.transform;
  const arcs = topo.arcs;
  function decodeArc(idx: number): Coord[] {
    const reverse = idx < 0;
    const a = arcs[reverse ? ~idx : idx];
    let x = 0;
    let y = 0;
    const out: Coord[] = [];
    for (let i = 0; i < a.length; i++) {
      x += a[i][0];
      y += a[i][1];
      out.push([
        x * tx.scale[0] + tx.translate[0],
        y * tx.scale[1] + tx.translate[1],
      ]);
    }
    if (reverse) out.reverse();
    return out;
  }
  function ring(arcIdxs: number[]): Coord[] {
    const r: Coord[] = [];
    for (let i = 0; i < arcIdxs.length; i++) {
      const seg = decodeArc(arcIdxs[i]);
      if (i === 0) r.push(...seg);
      else r.push(...seg.slice(1));
    }
    return r;
  }
  function geom(g: TopoGeometry): Coord[][][] {
    if (g.type === "Polygon") {
      return [(g.arcs as number[][]).map(ring)];
    }
    if (g.type === "MultiPolygon") {
      return (g.arcs as number[][][]).map((rs) => rs.map(ring));
    }
    return [];
  }
  return obj.geometries.map((g) => ({
    id: g.id,
    name: g.properties?.name,
    polygons: geom(g),
    a3: null,
  }));
}

function latLngToVec(lat: number, lng: number): Vec3 {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return [
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}

function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]];
}

function subdividePath(coords: Coord[], maxDeg = 3): Coord[] {
  const out: Coord[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy);
    if (dist > maxDeg) {
      const n = Math.ceil(dist / maxDeg);
      for (let k = 1; k < n; k++)
        out.push([a[0] + dx * (k / n), a[1] + dy * (k / n)]);
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

let COUNTRY_FEATURES: CountryFeature[] | null = null;
let LOADING: Promise<CountryFeature[]> | null = null;

function loadCountries(): Promise<CountryFeature[]> {
  if (COUNTRY_FEATURES) return Promise.resolve(COUNTRY_FEATURES);
  if (LOADING) return LOADING;
  LOADING = fetch("/countries-110m.json")
    .then((r) => r.json() as Promise<TopoJson>)
    .then((topo) => {
      const feats = topoFeature(topo, "countries");
      feats.forEach((f) => {
        f.polygons = f.polygons.map((poly) =>
          poly.map((ring) => subdividePath(ring, 3)),
        );
        f.a3 = (f.id != null && M49_TO_A3[String(f.id).padStart(3, "0")]) || null;
      });
      COUNTRY_FEATURES = feats;
      return feats;
    });
  return LOADING;
}

// ---------- Component ----------

export interface GlobeHandle {
  focusOn(lat: number, lng: number): void;
}

export interface GlobeProps {
  contracts: AtlasContract[];
  selectedCountry: string | null;
  hoveredCountry: string | null;
  onCountryClick?: (a3: string) => void;
  onCountryHover?: (a3: string | null) => void;
  onMarkerClick?: (contract: AtlasContract) => void;
  onMarkerHover?: (contract: AtlasContract | null) => void;
  rightInset?: number;
  leftInset?: number;
  autoRotate?: boolean;
}

interface CountryStat {
  count: number;
  value: number;
}
interface Stats {
  map: Record<string, CountryStat>;
  maxValue: number;
}
interface Marker {
  contract: AtlasContract;
  a3: string;
  lat: number;
  lng: number;
  valueM: number;
}
interface ProjectedMarker {
  marker: Marker;
  sx: number;
  sy: number;
  dotR: number;
}

interface GlobeState {
  rotY: number;
  rotX: number;
  zoom: number;
  dragging: boolean;
  dragMoved: number;
  lastX: number;
  lastY: number;
  velY: number;
  velX: number;
  autoRotate: boolean;
  hoverA3: string | null;
  hoverContractId: number | null;
  selectedA3: string | null;
  externalHoverA3: string | null;
}

interface DrawData {
  features: CountryFeature[] | null;
  stats: Stats;
  markers: Marker[];
  rightInset: number;
  leftInset: number;
  projectedMarkers?: ProjectedMarker[];
}

type TooltipState =
  | {
      kind: "country";
      x: number;
      y: number;
      country: string;
      contracts: number;
      value: number;
    }
  | {
      kind: "contract";
      x: number;
      y: number;
      title: string;
      agency: string;
      country: string;
      valueM: number;
    };

const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(
  {
    contracts,
    selectedCountry,
    hoveredCountry,
    onCountryClick,
    onCountryHover,
    onMarkerClick,
    onMarkerHover,
    rightInset = 0,
    leftInset = 0,
    autoRotate = true,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<CountryFeature[] | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const stateRef = useRef<GlobeState>({
    rotY: -0.4,
    rotX: -0.15,
    zoom: 1,
    dragging: false,
    dragMoved: 0,
    lastX: 0,
    lastY: 0,
    velY: 0,
    velX: 0,
    autoRotate,
    hoverA3: null,
    hoverContractId: null,
    selectedA3: null,
    externalHoverA3: null,
  });

  // Per-country contract stats — recomputed when contracts change
  const stats = useMemo<Stats>(() => {
    const map: Record<string, CountryStat> = {};
    contracts.forEach((c) => {
      if (!map[c.country]) map[c.country] = { count: 0, value: 0 };
      map[c.country].count += 1;
      map[c.country].value += c.valueM;
    });
    let maxValue = 0;
    Object.values(map).forEach((s) => {
      if (s.value > maxValue) maxValue = s.value;
    });
    return { map, maxValue };
  }, [contracts]);

  // Marker positions (per visible contract) — slight jitter so multiple
  // contracts in one country render as a small cluster of dots, not a single
  // overdrawn dot.
  const markers = useMemo<Marker[]>(() => {
    const out: Marker[] = [];
    const byCountry: Record<string, number> = {};
    contracts.forEach((c) => {
      const country = COUNTRY_BY_CODE[c.country];
      if (!country) return;
      const idx = (byCountry[c.country] = (byCountry[c.country] || 0) + 1) - 1;
      const ang = idx * 137.5 * DEG;
      const r = Math.sqrt(idx) * 0.9;
      out.push({
        contract: c,
        a3: c.country,
        lat: country.lat + Math.sin(ang) * r,
        lng: country.lng + Math.cos(ang) * r,
        valueM: c.valueM,
      });
    });
    return out;
  }, [contracts]);

  // Push fresh stuff into refs so the draw loop reads latest without restarting
  const dataRef = useRef<DrawData>({
    features: null,
    stats: { map: {}, maxValue: 0 },
    markers: [],
    rightInset: 0,
    leftInset: 0,
  });
  dataRef.current.features = features;
  dataRef.current.stats = stats;
  dataRef.current.markers = markers;
  dataRef.current.rightInset = rightInset;
  dataRef.current.leftInset = leftInset;

  // Animated focus on a country — eases rotation toward it
  const focusAnimRef = useRef<{
    startTime: number;
    duration: number;
    startY: number;
    startX: number;
    dY: number;
    dX: number;
  } | null>(null);
  useImperativeHandle(ref, () => ({
    focusOn(lat: number, lng: number) {
      const targetRotY = -Math.PI / 2 - lng * DEG;
      const targetRotX = lat * DEG;
      const startRotY = stateRef.current.rotY;
      const startRotX = stateRef.current.rotX;
      let dY = targetRotY - startRotY;
      dY = ((dY + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const clampedX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotX));
      const dX = clampedX - startRotX;
      focusAnimRef.current = {
        startTime: performance.now(),
        duration: 900,
        startY: startRotY,
        startX: startRotX,
        dY,
        dX,
      };
      stateRef.current.velY = 0;
      stateRef.current.velX = 0;
    },
  }));

  useEffect(() => {
    loadCountries().then(setFeatures);
  }, []);
  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);
  useEffect(() => {
    stateRef.current.selectedA3 = selectedCountry;
  }, [selectedCountry]);
  useEffect(() => {
    stateRef.current.externalHoverA3 = hoveredCountry;
  }, [hoveredCountry]);

  const projectPath = useCallback(
    (
      path: Coord[],
      cx: number,
      cy: number,
      R: number,
      rotYa: number,
      rotXa: number,
    ): [number, number][][] => {
      const segs: [number, number][][] = [];
      let cur: [number, number][] | null = null;
      for (let i = 0; i < path.length; i++) {
        const [lng, lat] = path[i];
        let v = latLngToVec(lat, lng);
        v = rotateY(v, rotYa);
        v = rotateX(v, rotXa);
        if (v[2] >= -0.02) {
          const sx = cx + v[0] * R;
          const sy = cy - v[1] * R;
          if (!cur) {
            cur = [[sx, sy]];
            segs.push(cur);
          } else cur.push([sx, sy]);
        } else cur = null;
      }
      return segs;
    },
    [],
  );

  // Hit test markers first (cursor on a contract dot)
  const hitMarker = useCallback(
    (mx: number, my: number): ProjectedMarker | null => {
      const proj = dataRef.current.projectedMarkers || [];
      let best: ProjectedMarker | null = null;
      let bestD = Infinity;
      for (const p of proj) {
        const d = Math.hypot(p.sx - mx, p.sy - my);
        const hr = Math.max(8, p.dotR + 4);
        if (d < hr && d < bestD) {
          bestD = d;
          best = p;
        }
      }
      return best;
    },
    [],
  );

  // Hit test: cursor → country
  const hitTest = useCallback(
    (mx: number, my: number): CountryFeature | null => {
      const feats = dataRef.current.features;
      if (!feats) return null;
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const ri = dataRef.current.rightInset || 0;
      const li = dataRef.current.leftInset || 0;
      const cx = li + (w - li - ri) / 2;
      const cy = h / 2;
      const usableW = Math.max(200, w - li - ri);
      const R = Math.min(usableW, h) * 0.42 * stateRef.current.zoom;
      const dx = (mx - cx) / R;
      const dy = -(my - cy) / R;
      const r2 = dx * dx + dy * dy;
      if (r2 > 1) return null;
      const dz = Math.sqrt(1 - r2);
      let v: Vec3 = [dx, dy, dz];
      v = rotateX(v, -stateRef.current.rotX);
      v = rotateY(v, -stateRef.current.rotY);
      const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v[1]))) / DEG;
      const lng = Math.atan2(v[2], -v[0]) / DEG - 180;
      const L = ((lng + 540) % 360) - 180;
      function pip(point: Coord, ring: Coord[]): boolean {
        let inside = false;
        const x = point[0];
        const y = point[1];
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i][0];
          const yi = ring[i][1];
          const xj = ring[j][0];
          const yj = ring[j][1];
          const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      }
      for (const f of feats) {
        for (const poly of f.polygons) {
          if (poly.length === 0) continue;
          if (pip([L, lat], poly[0])) return f;
        }
      }
      return null;
    },
    [],
  );

  // Animation loop — runs once on mount, never restarts
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    function resize() {
      if (!canvas || !wrap || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function frame() {
      if (!wrap || !ctx) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const ri = dataRef.current.rightInset || 0;
      const li = dataRef.current.leftInset || 0;
      const cx = li + (w - li - ri) / 2;
      const cy = h / 2;
      const usableW = Math.max(200, w - li - ri);
      const R = Math.min(usableW, h) * 0.42 * stateRef.current.zoom;

      ctx.clearRect(0, 0, w, h);

      const st = stateRef.current;
      const feats = dataRef.current.features;
      const stats = dataRef.current.stats;
      const markers = dataRef.current.markers;

      // Focus animation overrides auto-rotate / inertia
      if (focusAnimRef.current) {
        const fa = focusAnimRef.current;
        const t = Math.min(1, (performance.now() - fa.startTime) / fa.duration);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        st.rotY = fa.startY + fa.dY * e;
        st.rotX = fa.startX + fa.dX * e;
        if (t >= 1) focusAnimRef.current = null;
      } else {
        if (st.autoRotate && !st.dragging && !st.hoverA3 && !st.hoverContractId) {
          st.rotY -= 0.0004;
        }
        if (!st.dragging) {
          st.rotY += st.velY;
          st.rotX += st.velX;
          st.velY *= 0.9;
          st.velX *= 0.9;
        }
      }
      const maxX = Math.PI * 0.45;
      st.rotX = Math.max(-maxX, Math.min(maxX, st.rotX));
      const rotY = st.rotY;
      const rotX = st.rotX;

      // --- ocean / sphere ---
      const og = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.18);
      og.addColorStop(0, "rgba(15,23,42,0.06)");
      og.addColorStop(1, "rgba(15,23,42,0)");
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();

      const bg = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.4,
        R * 0.1,
        cx,
        cy,
        R,
      );
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.6, "#fafbfc");
      bg.addColorStop(1, "#eef1f5");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // graticule
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(15,23,42,0.04)";
      ctx.lineWidth = 1;
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 4) {
          let v = latLngToVec(lat, lng);
          v = rotateY(v, rotY);
          v = rotateX(v, rotX);
          if (v[2] < 0) {
            started = false;
            continue;
          }
          const sx = cx + v[0] * R;
          const sy = cy - v[1] * R;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      for (let lng = -180; lng < 180; lng += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -85; lat <= 85; lat += 4) {
          let v = latLngToVec(lat, lng);
          v = rotateY(v, rotY);
          v = rotateX(v, rotX);
          if (v[2] < 0) {
            started = false;
            continue;
          }
          const sx = cx + v[0] * R;
          const sy = cy - v[1] * R;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // --- countries ---
      if (feats) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();

        // Fills
        for (const f of feats) {
          const a3 = f.a3;
          const s = a3 ? stats.map[a3] : undefined;
          let heat: [number, number, number] | null = null;
          if (s) {
            const t = Math.pow(s.value / Math.max(1, stats.maxValue), 0.55);
            const ramp: [number, number, number][] = [
              [244, 244, 245],
              [228, 228, 231],
              [203, 213, 225],
              [148, 163, 184],
              [71, 85, 105],
              [15, 23, 42],
            ];
            const seg = (0.15 + t * 0.85) * (ramp.length - 1);
            const i = Math.floor(seg);
            const fr = seg - i;
            const a = ramp[i];
            const b = ramp[Math.min(ramp.length - 1, i + 1)];
            heat = [
              Math.round(a[0] + (b[0] - a[0]) * fr),
              Math.round(a[1] + (b[1] - a[1]) * fr),
              Math.round(a[2] + (b[2] - a[2]) * fr),
            ];
          }
          const isHover = a3 != null && st.hoverA3 === a3;
          const isSel = !!(st.selectedA3 && a3 && st.selectedA3 === a3);

          let fillStyle = heat
            ? `rgb(${heat[0]},${heat[1]},${heat[2]})`
            : "#f1f3f6";
          if (isSel) fillStyle = "#0f172a";
          else if (isHover)
            fillStyle = heat
              ? `rgb(${Math.max(0, heat[0] - 30)},${Math.max(0, heat[1] - 30)},${Math.max(0, heat[2] - 30)})`
              : "#cbd5e1";

          for (const poly of f.polygons) {
            if (poly.length === 0) continue;
            const segs = projectPath(poly[0], cx, cy, R, rotY, rotX);
            for (const seg of segs) {
              if (seg.length < 2) continue;
              ctx.beginPath();
              ctx.moveTo(seg[0][0], seg[0][1]);
              for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i][0], seg[i][1]);
              ctx.closePath();
              ctx.fillStyle = fillStyle;
              ctx.fill();
            }
          }
        }

        // Borders
        for (const f of feats) {
          const a3 = f.a3;
          const isHover = a3 != null && st.hoverA3 === a3;
          const isSel = !!(st.selectedA3 && a3 && st.selectedA3 === a3);
          for (const poly of f.polygons) {
            if (poly.length === 0) continue;
            for (const ring of poly) {
              const segs = projectPath(ring, cx, cy, R, rotY, rotX);
              for (const seg of segs) {
                if (seg.length < 2) continue;
                ctx.beginPath();
                ctx.moveTo(seg[0][0], seg[0][1]);
                for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i][0], seg[i][1]);
                if (isSel) {
                  ctx.strokeStyle = "rgba(15,23,42,0.95)";
                  ctx.lineWidth = 1.6;
                } else if (isHover) {
                  ctx.strokeStyle = "rgba(15,23,42,0.7)";
                  ctx.lineWidth = 1.2;
                } else {
                  ctx.strokeStyle = "rgba(255,255,255,0.85)";
                  ctx.lineWidth = 0.6;
                }
                ctx.stroke();
              }
            }
          }
        }

        // --- contract markers (small dots) ---
        const projectedMarkers: ProjectedMarker[] = [];
        if (markers && markers.length) {
          for (const m of markers) {
            let v = latLngToVec(m.lat, m.lng);
            v = rotateY(v, rotY);
            v = rotateX(v, rotX);
            if (v[2] < 0) continue;
            const sx = cx + v[0] * R;
            const sy = cy - v[1] * R;
            const depth = 0.4 + 0.6 * v[2];
            const dotR = 1.4 + Math.min(2.2, Math.sqrt(m.valueM) * 0.18);
            const isHover = st.hoverContractId === m.contract.id;
            ctx.fillStyle = isHover ? "#0f172a" : `rgba(15, 23, 42, ${0.85 * depth})`;
            ctx.beginPath();
            ctx.arc(sx, sy, isHover ? dotR + 1.4 : dotR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${0.85 * depth})`;
            ctx.lineWidth = isHover ? 1.4 : 0.8;
            ctx.beginPath();
            ctx.arc(sx, sy, (isHover ? dotR + 1.4 : dotR) + 0.6, 0, Math.PI * 2);
            ctx.stroke();
            projectedMarkers.push({ marker: m, sx, sy, dotR });
          }
        }
        dataRef.current.projectedMarkers = projectedMarkers;

        ctx.restore();
      }

      // limb darkening
      const limb = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R);
      limb.addColorStop(0, "rgba(15,23,42,0)");
      limb.addColorStop(1, "rgba(15,23,42,0.10)");
      ctx.fillStyle = limb;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // specular
      const spec = ctx.createRadialGradient(
        cx - R * 0.4,
        cy - R * 0.45,
        R * 0.05,
        cx - R * 0.4,
        cy - R * 0.45,
        R * 0.55,
      );
      spec.addColorStop(0, "rgba(255,255,255,0.4)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // never restarts

  // ---------- Pointer ----------

  const tooltipRef = useRef<TooltipState | null>(null);
  tooltipRef.current = tooltip;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    stateRef.current.dragging = true;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
    stateRef.current.dragMoved = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (stateRef.current.dragging) {
      const dx = e.clientX - stateRef.current.lastX;
      const dy = e.clientY - stateRef.current.lastY;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      const k = 0.005;
      stateRef.current.rotY += dx * k;
      stateRef.current.rotX += dy * k;
      stateRef.current.velY = dx * k * 0.4;
      stateRef.current.velX = dy * k * 0.4;
      stateRef.current.dragMoved += Math.abs(dx) + Math.abs(dy);
    }
    const mhit = hitMarker(mx, my);
    if (mhit) {
      const c = mhit.marker.contract;
      if (stateRef.current.hoverContractId !== c.id) {
        stateRef.current.hoverContractId = c.id;
        onMarkerHover?.(c);
      }
      stateRef.current.hoverA3 = c.country;
      setTooltip({
        kind: "contract",
        x: mhit.sx,
        y: mhit.sy,
        title: c.title,
        agency: c.agency,
        country: c.countryName,
        valueM: c.valueM,
      });
      return;
    }
    if (stateRef.current.hoverContractId) {
      stateRef.current.hoverContractId = null;
      onMarkerHover?.(null);
    }
    const hit = hitTest(mx, my);
    const a3 = hit?.a3 || null;
    if (a3 !== stateRef.current.hoverA3) {
      stateRef.current.hoverA3 = a3;
      onCountryHover?.(a3);
    }
    if (hit) {
      const s = a3 ? dataRef.current.stats.map[a3] : undefined;
      setTooltip({
        kind: "country",
        x: mx,
        y: my,
        country: hit.name ?? "",
        contracts: s?.count || 0,
        value: s?.value || 0,
      });
    } else if (tooltipRef.current) {
      setTooltip(null);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasDrag =
      stateRef.current.dragging && stateRef.current.dragMoved > 6;
    stateRef.current.dragging = false;
    if (!wasDrag) {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mhit = hitMarker(mx, my);
      if (mhit) {
        onMarkerClick?.(mhit.marker.contract);
        return;
      }
      const hit = hitTest(mx, my);
      if (hit && hit.a3) onCountryClick?.(hit.a3);
    }
  };

  const onPointerLeave = () => {
    stateRef.current.dragging = false;
    stateRef.current.hoverA3 = null;
    stateRef.current.hoverContractId = null;
    setTooltip(null);
    onCountryHover?.(null);
    onMarkerHover?.(null);
  };

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const z = stateRef.current.zoom * (1 - e.deltaY * 0.0015);
    stateRef.current.zoom = Math.max(0.7, Math.min(2.6, z));
  };

  return (
    <div
      ref={wrapRef}
      className="globe-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} />
      {tooltip && tooltip.kind === "country" && (
        <div
          className="tooltip visible"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="country">{tooltip.country}</div>
          <div className="row">
            <span>
              Contracts<b>{tooltip.contracts}</b>
            </span>
            <span>
              Value<b>${tooltip.value.toFixed(1)}M</b>
            </span>
          </div>
        </div>
      )}
      {tooltip && tooltip.kind === "contract" && (
        <div
          className="tooltip tooltip-contract visible"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="country">{tooltip.title}</div>
          <div className="row">
            <span>{tooltip.agency}</span>
          </div>
          <div className="row">
            <span>{tooltip.country}</span>
            <span>
              Value<b>${tooltip.valueM.toFixed(1)}M</b>
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default Globe;
