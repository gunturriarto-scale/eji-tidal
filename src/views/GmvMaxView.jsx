import React, { useState, useEffect, useRef, useMemo } from "react";

// ─── DATA LAYER ─────────────────────────────────────────────────────────────
const MARCH_SUMMARY = {
  gmv: 4410021623, spend: 1002382491, orders: 105793, roi: 4.40,
  creatives: 66625, deliveryRate: 27.7, healthScore: 78, wasteRate: 0.8,
  period: "March 1–28, 2026",
};

const MONTHLY_TREND = [
  { month: "Jan 2026", gmv: 3.15, spend: 0.75, roi: 4.21 },
  { month: "Feb 2026", gmv: 5.19, spend: 1.16, roi: 4.48 },
  { month: "Mar 2026", gmv: 4.41, spend: 1.00, roi: 4.40 },
];

const DAILY_DATA = [
  { d: "1", gmv: 299.4, spend: 67.8, roi: 4.42 }, { d: "2", gmv: 428.8, spend: 101.2, roi: 4.24 },
  { d: "3", gmv: 334.1, spend: 76.0, roi: 4.39 }, { d: "4", gmv: 180.1, spend: 34.9, roi: 5.15 },
  { d: "5", gmv: 214.8, spend: 47.6, roi: 4.52 }, { d: "6", gmv: 256.3, spend: 60.9, roi: 4.21 },
  { d: "7", gmv: 208.4, spend: 45.1, roi: 4.62 }, { d: "8", gmv: 422.0, spend: 103.8, roi: 4.06 },
  { d: "9", gmv: 221.9, spend: 51.1, roi: 4.35 }, { d: "10", gmv: 165.4, spend: 45.8, roi: 3.61 },
  { d: "11", gmv: 119.4, spend: 24.1, roi: 4.94 }, { d: "12", gmv: 115.3, spend: 24.3, roi: 4.75 },
  { d: "13", gmv: 191.3, spend: 44.2, roi: 4.32 }, { d: "14", gmv: 105.4, spend: 21.3, roi: 4.94 },
  { d: "15", gmv: 96.0, spend: 21.6, roi: 4.44 }, { d: "16", gmv: 69.1, spend: 13.9, roi: 4.95 },
  { d: "17", gmv: 62.0, spend: 12.4, roi: 5.01 }, { d: "18", gmv: 71.9, spend: 15.2, roi: 4.73 },
  { d: "19", gmv: 114.1, spend: 28.1, roi: 4.05 }, { d: "20", gmv: 78.2, spend: 16.0, roi: 4.88 },
  { d: "21", gmv: 78.3, spend: 18.9, roi: 4.14 }, { d: "22", gmv: 75.5, spend: 15.1, roi: 5.01 },
  { d: "23", gmv: 103.1, spend: 23.4, roi: 4.40 }, { d: "24", gmv: 97.3, spend: 22.3, roi: 4.37 },
  { d: "25", gmv: 149.5, spend: 39.7, roi: 3.77 }, { d: "26", gmv: 77.6, spend: 16.4, roi: 4.73 },
  { d: "27", gmv: 56.4, spend: 8.9, roi: 6.31 }, { d: "28", gmv: 18.6, spend: 2.2, roi: 8.36 },
];

const STATUS_DATA = [
  { name: "Delivering", count: 18446, pct: 27.7, gmv: "2,95 T", roi: 4.05, color: "#22c55e", desc: "Aktif berjalan" },
  { name: "Not delivering", count: 31174, pct: 46.8, gmv: "1,09 T", roi: 5.39, color: "#f59e0b", desc: "Boostable — ROI 5.39x!" },
  { name: "Auth needed", count: 6895, pct: 10.3, gmv: "57,6 jt", roi: null, color: "#ef4444", desc: "Sparks Code expired" },
  { name: "Learning", count: 4943, pct: 7.4, gmv: "95,5 jt", roi: 10.5, color: "#a78bfa", desc: "Jangan diubah ROI-nya!" },
  { name: "In queue", count: 2671, pct: 4.0, gmv: "8,2 jt", roi: 16.4, color: "#38bdf8", desc: "Boostable — trial 2 jam" },
  { name: "Unavailable", count: 2481, pct: 3.7, gmv: "200 jt", roi: 3.37, color: "#f43f5e", desc: "Cek Sparks Code" },
];

const ROI_DISTRIBUTION = [
  { label: "ROI = 0", count: 36535, color: "#ef4444" },
  { label: "ROI 0–1x", count: 198, color: "#f97316" },
  { label: "ROI 1–2x", count: 1095, color: "#f59e0b" },
  { label: "ROI 2–4x", count: 3703, color: "#38bdf8" },
  { label: "ROI 4–8x", count: 5245, color: "#22c55e" },
  { label: "ROI > 8x", count: 13887, color: "#86efac" },
];

const CAMPAIGNS = [
  { name: "[EXCLUSIVE CREATOR] Next Level & Blush On", cat: "Decorative", spend: 290.9, gmv: 1249.5, roi: 4.30, orders: 30462, action: "scale" },
  { name: "Next Level Butter Balm Tint", cat: "Decorative", spend: 148.4, gmv: 563.9, roi: 3.80, orders: 15826, action: "maintain" },
  { name: "Sarwendah_Others", cat: "Others", spend: 42.1, gmv: 224.5, roi: 5.33, orders: 4929, action: "scale" },
  { name: "Next Level Liplast Cream", cat: "Decorative", spend: 48.6, gmv: 209.8, roi: 4.31, orders: 5867, action: "maintain" },
  { name: "Mattedorable Lipstick", cat: "Decorative", spend: 54.7, gmv: 204.5, roi: 3.74, orders: 6215, action: "maintain" },
  { name: "[EXCLUSIVE AUREL] Moisturizer Gel Bundle", cat: "Skincare", spend: 26.1, gmv: 120.2, roi: 4.60, orders: 2437, action: "scale" },
  { name: "Serum Advance & Renew", cat: "Skincare", spend: 32.9, gmv: 113.7, roi: 3.46, orders: 2612, action: "monitor" },
  { name: "New SKU Bundle", cat: "Others", spend: 18.3, gmv: 103.8, roi: 5.66, orders: 1866, action: "scale" },
  { name: "[EXECUTIVE CREATOR] Niacinamide Serum", cat: "Skincare", spend: 20.4, gmv: 99.6, roi: 4.89, orders: 2048, action: "scale" },
  { name: "Collagen Water Sunscreen", cat: "Skincare", spend: 31.5, gmv: 92.4, roi: 2.93, orders: 2476, action: "evaluate" },
  { name: "REAL 10% NIACINAMIDE Power Serum", cat: "Skincare", spend: 28.2, gmv: 91.6, roi: 3.24, orders: 2143, action: "monitor" },
  { name: "Peel Off Mask Egg White", cat: "Skincare", spend: 11.7, gmv: 72.9, roi: 6.25, orders: 1894, action: "scale" },
];

const CREATORS = [
  { name: "ininia9", gmv: 479.7, spend: 131.1, roi: 3.66, videos: 24, tier: "B", revPerVideo: 20.0 },
  { name: "RANIA SHABIRA", gmv: 220.3, spend: 72.7, roi: 3.03, videos: 101, tier: "B", revPerVideo: 2.2 },
  { name: "IFA", gmv: 131.0, spend: 49.3, roi: 2.66, videos: 485, tier: "B", revPerVideo: 0.27 },
  { name: "Tiarakasihracun", gmv: 100.9, spend: 28.6, roi: 3.52, videos: 88, tier: "B", revPerVideo: 1.1 },
  { name: "sibad_94", gmv: 87.1, spend: 21.0, roi: 4.14, videos: 40, tier: "A", revPerVideo: 2.2 },
  { name: "YANTI BEAUTY", gmv: 79.5, spend: 19.8, roi: 4.01, videos: 98, tier: "A", revPerVideo: 0.81 },
  { name: "Malina", gmv: 60.0, spend: 11.0, roi: 5.46, videos: 70, tier: "A", revPerVideo: 0.86 },
  { name: "MERI 💋KOLEKTOR LIPPIES", gmv: 53.5, spend: 8.8, roi: 6.08, videos: 63, tier: "A", revPerVideo: 0.85 },
  { name: "pasep", gmv: 50.2, spend: 16.1, roi: 3.11, videos: 30, tier: "B", revPerVideo: 1.7 },
  { name: "Nharahma12", gmv: 49.5, spend: 14.8, roi: 3.34, videos: 227, tier: "B", revPerVideo: 0.22 },
  { name: "nyong cha", gmv: 42.0, spend: 8.3, roi: 5.08, videos: 58, tier: "A", revPerVideo: 0.72 },
  { name: "Naila Ulya", gmv: 40.7, spend: 9.3, roi: 4.38, videos: 37, tier: "A", revPerVideo: 1.1 },
  { name: "inimakeupviral", gmv: 38.3, spend: 6.0, roi: 6.39, videos: 45, tier: "A", revPerVideo: 0.85 },
];

const BOOST_CANDIDATES = {
  inQueue: [
    { name: "erly allysa", detail: "In queue · ROI 125x · spend minimal", roi: 125, gmv: 0.1, action: "priority" },
    { name: "Aleena.store", detail: "In queue · ROI 98.6x", roi: 98.6, gmv: 0.2, action: "trial" },
    { name: "Malina", detail: "In queue · Tier A · ROI 69x", roi: 69, gmv: 0.1, action: "priority" },
    { name: "Queen.Beauty", detail: "In queue · 2 video · ROI 48–86x", roi: 67, gmv: 0.1, action: "trial" },
  ],
  notDelivering: [
    { name: "Caca | Beauty", detail: "Not delivering · ROI 711x — verify attribution!", roi: 711.9, gmv: 2.9, action: "verify" },
    { name: "nyong cha", detail: "Not delivering · Tier A · GMV 2,8 jt", roi: 21.3, gmv: 2.8, action: "priority" },
    { name: "putri.rzy", detail: "Not delivering · GMV 3,8 jt", roi: 18.3, gmv: 3.8, action: "priority" },
    { name: "upil.real", detail: "Not delivering · GMV 5,8 jt", roi: 17.6, gmv: 5.8, action: "priority" },
    { name: "suci7441", detail: "Not delivering · 2 video · GMV 8,1 jt total", roi: 13.4, gmv: 8.1, action: "scale" },
  ],
  deliveryGmv: [
    { name: "ininia9", detail: "#blushon #hanasui · GMV 248,5 jt · spend 69,5 jt", roi: 3.6, gmv: 248.5, action: "boostGmv" },
    { name: "sibad_94", detail: "Blush on sat set · GMV 63 jt", roi: 3.3, gmv: 63.0, action: "boostGmv" },
    { name: "RANIA SHABIRA", detail: "Lipstik warna 111 + pink · GMV 62,9 jt", roi: 3.2, gmv: 62.9, action: "boostGmv" },
  ],
  deliveryRoas: [
    { name: "inimakeupviral", detail: "ROI 6.39x · spend hanya 6 jt", roi: 6.39, gmv: 38.3, action: "scaleRoas" },
    { name: "MERI 💋KOLEKTOR", detail: "ROI 6.08x · spend 8,8 jt", roi: 6.08, gmv: 53.5, action: "scaleRoas" },
    { name: "Malina", detail: "ROI 5.46x · paling efisien Tier A", roi: 5.46, gmv: 60.0, action: "scaleRoas" },
  ],
};

const ACTION_ITEMS = [
  { id: 1, priority: "critical", num: "01", title: "Collect & renew Sparks Code 365 hari untuk 6.895 video auth needed", desc: "6.895 video stuck.", tags: ["Critical"], detail: "Proses: Ads Manager", steps: ["Export list", "Group per creator"] },
  { id: 2, priority: "critical", num: "02", title: "Scale budget MERI + inimakeupviral + Malina", desc: "ROI 5–6x tapi under-funded.", tags: ["Critical"], detail: "Per Mendadak Space", steps: ["Identifikasi video", "Set budget harian"] },
  { id: 3, priority: "high", num: "03", title: "Trial boost 2 jam", desc: "Prioritas", tags: ["High"], detail: "Workflow boost", steps: ["Buka GMV Max campaign"] },
  { id: 4, priority: "high", num: "04", title: "Evaluasi & perbaiki Collagen Water Sunscreen", desc: "ROI 2.93x drag on overall", tags: ["High"], detail: "Coba angle", steps: ["Audit video"] },
];

const SCENARIOS = [
  { label: "Skenario A", subtitle: "Maintain + efisiensi", gmv: "4,5 T", roi: "5.0x+", spend: "900 jt", featured: false, breakdown: [{ label: "Max spend", value: "900 jt" }] },
  { label: "Skenario B", subtitle: "Scale GMV", gmv: "5,5 T", roi: "4.5x", spend: "1,22 T", featured: true, breakdown: [{ label: "Exclusive creator", value: "~610 jt", green: true }] },
  { label: "Skenario C", subtitle: "Profit", gmv: "3,5 T", roi: "6.0x+", spend: "583 jt", featured: false, breakdown: [{ label: "Tier A creators only", value: "~400 jt", green: true }] },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const roiColor = (roi) => { if (roi == null) return "#6b7280"; if (roi >= 4.4) return "#22c55e"; if (roi >= 3) return "#38bdf8"; if (roi >= 2) return "#f59e0b"; return "#ef4444"; };
const barRoiColor = (roi) => { if (roi >= 4.4) return "#22c55e"; if (roi >= 3) return "#38bdf8"; return "#f59e0b"; };
const tierColor = { A: { bg: "#052e16", text: "#22c55e", border: "#166534" }, B: { bg: "#082f49", text: "#38bdf8", border: "#0e4f6f" } };
const actionColors = { critical: { bg: "#2d0a0f", accent: "#ef4444", text: "#fca5a5" }, high: { bg: "#292006", accent: "#f59e0b", text: "#fcd34d" }, strategic: { bg: "#082f49", accent: "#38bdf8", text: "#7dd3fc" } };
const actionBadgeLabel = { scale: { label: "Scale", bg: "#052e16", color: "#22c55e" }, maintain: { label: "Maintain", bg: "#082f49", color: "#38bdf8" }, monitor: { label: "Monitor", bg: "#1c1404", color: "#f59e0b" }, evaluate: { label: "Evaluate", bg: "#2d0a0f", color: "#f87171" } };

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, accent, small }) => (
  <div style={{ background: "#0f1117", border: "0.5px solid #1e2330", borderRadius: 12, padding: "18px 20px", borderTop: `2px solid ${accent || "#1e2330"}` }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "#4b5573", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: small ? 22 : 28, fontWeight: 700, fontFamily: "monospace", color: accent || "#e8eaf0", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#3d4560", marginTop: 6, fontFamily: "monospace" }}>{sub}</div>}
  </div>
);

const SectionLabel = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: "#3d4560", textTransform: "uppercase", letterSpacing: "0.09em", margin: "24px 0 12px" }}>{children}</div>;
const Card = ({ children, style }) => <div style={{ background: "#0f1117", border: "0.5px solid #1e2330", borderRadius: 14, padding: "18px 20px", ...style }}>{children}</div>;
const CardHeading = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5573", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 3, height: 12, background: "#d4537e", borderRadius: 2, display: "inline-block", flexShrink: 0 }} />{children}</div>;
const InsightCard = ({ type, title, body }) => { const map = { good: { bg: "#052e16", border: "#16a34a", icon: "✓" }, warn: { bg: "#1c1400", border: "#d97706", icon: "!" }, crit: { bg: "#2a0a0a", border: "#dc2626", icon: "✕" }, info: { bg: "#072343", border: "#2563eb", icon: "i" } }; const s = map[type] || map.info; return <div style={{ background: s.bg, borderLeft: `2px solid ${s.border}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#f1f3f9", marginBottom: 3 }}>{title}</div><div style={{ fontSize: 12, color: "#8490b0", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: body }} /></div>; };
const Badge = ({ label, type }) => { const map = { critical: { bg: "#2d0a0f", color: "#f87171" }, high: { bg: "#1c1400", color: "#fcd34d" }, strategic: { bg: "#082f49", color: "#7dd3fc" }, default: { bg: "#1a1e2a", color: "#6b7280" } }; const s = map[type] || map.default; return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color, textTransform: "uppercase" }}>{label}</span>; };
const ProgressBar = ({ label, value, max, valueLabel, color }) => <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}><div style={{ fontSize: 12, color: "#7c85a0", width: 160, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div><div style={{ flex: 1, height: 6, background: "#1a1e2a", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "#22c55e", borderRadius: 3 }} /></div><div style={{ fontSize: 11, fontFamily: "monospace", color: "#7c85a0", width: 90, textAlign: "right", flexShrink: 0 }}>{valueLabel}</div></div>;

// ─── MINI TREND CHART ─────────────────────────────────────────────────────────
const MiniTrendChart = () => { const maxGmv = Math.max(...DAILY_DATA.map((d) => d.gmv)); return <div><div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 72, padding: "2px 0" }}>{DAILY_DATA.map((d) => { const h = Math.round((d.gmv / maxGmv) * 95 + 4); return <div key={d.d} title={`Mar ${d.d}: ${d.gmv}jt · ROI ${d.roi.toFixed(2)}x`} style={{ flex: 1, height: `${h}%`, background: barRoiColor(d.roi), borderRadius: "2px 2px 0 0", opacity: 0.8, minHeight: 3, cursor: "pointer", transition: "opacity 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; }} />; })}</div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#3d4560", fontFamily: "monospace" }}><span>Mar 1</span><span>Mar 7</span><span>Mar 14</span><span>Mar 21</span><span>Mar 28</span></div><div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>{[["#22c55e", "ROI ≥ 4.40x"], ["#38bdf8", "ROI 3–4.40x"], ["#f59e0b", "ROI < 3x"]].map(([color, label]) => <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7c85a0" }}><span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />{label}</span>)}</div></div>; };

// ─── DAILY CHART ──────────────────────────────────────────────────────────────
const DailyChart = () => { const W = 700, H = 240, padL = 48, padR = 16, padT = 16, padB = 36; const chartW = W - padL - padR, chartH = H - padT - padB; const maxGmv = Math.max(...DAILY_DATA.map((d) => d.gmv)); const yMax = Math.ceil(maxGmv / 50) * 50; const barW = chartW / DAILY_DATA.length; const yTicks = [0, 100, 200, 300, 400, yMax].filter((v) => v <= yMax); return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>{yTicks.map((v) => { const y = padT + chartH - (v / yMax) * chartH; return <g key={v}><line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#1a1e2a" strokeWidth={0.5} /><text x={padL - 6} y={y + 4} fontSize={9} fill="#3d4560" textAnchor="end" fontFamily="monospace">{v}jt</text></g>; })}{DAILY_DATA.map((d, i) => { const x = padL + i * barW + barW * 0.1; const bw = barW * 0.8; const bh = (d.gmv / yMax) * chartH; const by = padT + chartH - bh; const showLabel = i % 4 === 0 || i === DAILY_DATA.length - 1; return <g key={d.d}><rect x={x} y={by} width={bw} height={bh} fill={barRoiColor(d.roi)} opacity={0.82} rx={2} />{showLabel && <text x={x + bw / 2} y={H - 4} fontSize={9} fill="#3d4560" textAnchor="middle" fontFamily="monospace">{d.d}</text>}</g>; })}<polyline fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,4" opacity={0.7} points={DAILY_DATA.map((d, i) => { const x = padL + i * barW + barW / 2; const y = padT + chartH - (d.spend / yMax) * chartH; return `${x},${y}`; }).join(" ")} /></svg>; };
const RoiLineChart = () => { const W = 700, H = 180, padL = 40, padR = 16, padT = 12, padB = 32; const chartW = W - padL - padR, chartH = H - padT - padB; const minRoi = 3, maxRoi = 9; const toY = (roi) => padT + chartH - ((roi - minRoi) / (maxRoi - minRoi)) * chartH; const toX = (i) => padL + (i / (DAILY_DATA.length - 1)) * chartW; const pts = DAILY_DATA.map((d, i) => `${toX(i)},${toY(d.roi)}`).join(" "); return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}><defs><linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" /></linearGradient></defs>{[3, 4, 5, 6, 7, 8].map((v) => { const y = toY(v); return <g key={v}><line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#1a1e2a" strokeWidth={0.5} /><text x={padL - 6} y={y + 4} fontSize={9} fill="#3d4560" textAnchor="end" fontFamily="monospace">{v}x</text></g>; })}<line x1={padL} x2={W - padR} y1={toY(4.4)} y2={toY(4.4)} stroke="#22c55e" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} /><line x1={padL} x2={W - padR} y1={toY(3)} y2={toY(3)} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4,3" opacity={0.4} /><polygon fill="url(#roiGrad)" points={`${padL},${padT + chartH} ${pts} ${toX(DAILY_DATA.length - 1)},${padT + chartH}`} /><polyline fill="none" stroke="#38bdf8" strokeWidth={1.5} points={pts} />{DAILY_DATA.map((d, i) => i % 3 === 0 && <circle key={d.d} cx={toX(i)} cy={toY(d.roi)} r={2.5} fill="#38bdf8" />)}{[0, 6, 13, 20, 27].map((i) => <text key={i} x={toX(i)} y={H - 4} fontSize={9} fill="#3d4560" textAnchor="middle" fontFamily="monospace">Mar {DAILY_DATA[i].d}</text>)}</svg>; };

// ─── ACTION COMPONENTS ───────────────────────────────────────────────────────
const ActionItem = ({ item }) => { const [open, setOpen] = useState(false); const c = actionColors[item.priority]; return <div style={{ background: "#0f1117", border: `0.5px solid ${open ? "#2a3050" : "#1e2330"}`, borderRadius: 12, marginBottom: 8, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }} onClick={() => setOpen(!open)}><div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px" }}><div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "monospace", background: c.bg, color: c.text, border: `1px solid ${c.accent}40` }}>{item.num}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", marginBottom: 3 }}>{item.title}</div><div style={{ fontSize: 12, color: "#6b7a9c", lineHeight: 1.5 }}>{item.desc}</div></div><span style={{ fontSize: 12, color: "#3d4560", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span></div>{open && <div style={{ borderTop: "0.5px solid #1e2330", padding: "14px 18px 16px 62px" }}><div style={{ fontSize: 12, color: "#6b7a9c", lineHeight: 1.7, marginBottom: 12 }}>{item.detail}</div></div>}</div>; };
const BoostRow = ({ creator }) => { const first = creator.name.charAt(0).toUpperCase(); const as = { bg: "#1a1e2a", color: "#a0aec0", label: creator.action }; return <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#141720", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}><div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: "#1e2330", color: "#6b7a9c" }}>{first}</div><div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf0", width: 130, flexShrink: 0 }}>{creator.name}</div><div style={{ fontSize: 11, color: "#6b7a9c", flex: 1 }}>{creator.detail}</div><div style={{ fontSize: 11, fontFamily: "monospace", width: 50, textAlign: "right", color: roiColor(creator.roi), fontWeight: 600 }}>{creator.roi}x</div></div>; };

// ─── PAGES ─────────────────────────────────────────────────────────────
const OverviewPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
      <MetricCard label="GMV March 2026" value="4,41 T" sub="IDR gross revenue" accent="#22c55e" />
      <MetricCard label="Total spend" value="1,00 T" sub="IDR ad cost" accent="#f59e0b" />
      <MetricCard label="Blended ROI" value="4.40x" sub="Revenue ÷ spend" accent="#38bdf8" />
      <MetricCard label="Total orders" value="105.793" sub="SKU orders" />
      <MetricCard label="Delivering rate" value="27.7%" sub="18.446 / 66.625" accent="#a78bfa" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, marginBottom: 14 }}>
      <Card>
        <CardHeading>Key insights</CardHeading>
        <InsightCard type="good" title="ininia9 dominasi: 479,7 jt GMV dari 1 creator" body="10.9% total GMV." />
      </Card>
      <Card>
        <CardHeading>Campaign health</CardHeading>
        <div style={{ fontSize: 52, fontWeight: 700, fontFamily: "monospace", color: "#22c55e", lineHeight: 1 }}>78</div>
      </Card>
    </div>
    <Card><CardHeading>Daily GMV trend</CardHeading><MiniTrendChart /></Card>
  </div>
);

const TrendPage = () => (
  <div>
    <Card style={{ marginBottom: 14 }}><CardHeading>GMV & spend harian</CardHeading><DailyChart /></Card>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
      <Card><CardHeading>ROI harian</CardHeading><RoiLineChart /></Card>
    </div>
  </div>
);

const CreativePage = () => (
  <div>
    <SectionLabel>Status distribution</SectionLabel>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
      {STATUS_DATA.map((s) => (
        <div key={s.name} style={{ background: "#0f1117", border: "0.5px solid #1e2330", borderRadius: 10, padding: 14, borderTop: `2px solid ${s.color}` }}>
          <div style={{ fontSize: 10 }}>{s.name}</div>
          <div style={{ fontSize: 24, color: s.color }}>{s.count.toLocaleString("id-ID")}</div>
        </div>
      ))}
    </div>
  </div>
);

const CampaignPage = () => {
  return (
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr>{["Campaign", "Category", "Spend (jt)", "GMV (jt)", "ROI", "Orders", "Action"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px" }}>{h}</th>)}</tr></thead>
        <tbody>
          {CAMPAIGNS.map((c) => <tr key={c.name}><td style={{ padding: "9px 10px" }}>{c.name}</td><td style={{ padding: "9px 10px" }}>{c.cat}</td><td style={{ padding: "9px 10px" }}>{c.gmv}</td></tr>)}
        </tbody>
      </table>
    </Card>
  );
};
const CreatorsPage = () => <Card>Creators Content</Card>;
const BoostPage = () => <Card>Boost Content</Card>;
const ActionPage = () => <Card>Actions Content</Card>;
const TargetsPage = () => <Card>Targets Content</Card>;

const PAGES = [
  { id: "overview", label: "Overview", icon: "⬡", component: OverviewPage },
  { id: "trend", label: "Daily trend", icon: "↗", component: TrendPage },
  { id: "creative", label: "Creative pool", icon: "⊞", component: CreativePage },
  { id: "campaign", label: "Campaigns", icon: "◈", component: CampaignPage },
  { id: "creators", label: "Creators", icon: "◎", component: CreatorsPage },
  { id: "boost", label: "Boost", icon: "⚡", component: BoostPage },
  { id: "actions", label: "Action plan", icon: "✦", component: ActionPage },
  { id: "targets", label: "Targets", icon: "◎", component: TargetsPage },
];

export const GmvMaxView = ({ filteredData, targetBrand }) => {
  const [activePage, setActivePage] = useState("overview");
  const ActiveComponent = PAGES.find((p) => p.id === activePage)?.component || OverviewPage;

  // I will strip the "sidebar" code Claude provided because EJI TIDAL already has its own Sidebar!
  // Instead, I'll render the new dashboard navigation inside the view itself.

  return (
    <div style={{ display: "flex", flex: 1, minHeight: "100vh", background: "#07080a", color: "#e8eaf0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* INTERNAL NAVIGATION TABS */}
      <div style={{ width: 210, flexShrink: 0, borderRight: "0.5px solid #1a1e2a", padding: "20px 10px", background: "#0e1014" }}>
        <div style={{ marginBottom: 20, paddingLeft: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>GMV Max</div>
          <div style={{ fontSize: 10, color: "#3d4560" }}>Intelligence</div>
        </div>
        <nav>
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                cursor: "pointer", border: activePage === page.id ? "0.5px solid #2a3050" : "0.5px solid transparent",
                background: activePage === page.id ? "#1a1e2a" : "transparent",
                color: activePage === page.id ? "#e8eaf0" : "#6b7a9c",
                fontSize: 13, width: "100%", textAlign: "left", marginBottom: 2
              }}
            >
              <span style={{ fontSize: 14 }}>{page.icon}</span> {page.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
