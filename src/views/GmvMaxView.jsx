import React, { useState, useMemo } from "react";

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const roiColor = (roi) => { if (roi == null) return "#6b7280"; if (roi >= 4.4) return "#22c55e"; if (roi >= 3) return "#38bdf8"; if (roi >= 2) return "#f59e0b"; return "#ef4444"; };
const barRoiColor = (roi) => { if (roi >= 4.4) return "#22c55e"; if (roi >= 3) return "#38bdf8"; return "#f59e0b"; };
const tierColor = { A: { bg: "#052e16", text: "#22c55e", border: "#166534" }, B: { bg: "#082f49", text: "#38bdf8", border: "#0e4f6f" }, C: { bg: "#1a1a1a", text: "#a0aec0", border: "#333" } };
const actionColors = { critical: { bg: "#2d0a0f", accent: "#ef4444", text: "#fca5a5" }, high: { bg: "#292006", accent: "#f59e0b", text: "#fcd34d" }, strategic: { bg: "#082f49", accent: "#38bdf8", text: "#7dd3fc" } };
const actionBadgeLabel = { scale: { label: "Scale", bg: "#052e16", color: "#22c55e" }, maintain: { label: "Maintain", bg: "#082f49", color: "#38bdf8" }, monitor: { label: "Monitor", bg: "#1c1404", color: "#f59e0b" }, evaluate: { label: "Evaluate", bg: "#2d0a0f", color: "#f87171" }, kill: { label: "Kill", bg: "#2d0a2e", color: "#f43f5e" } };

const fmt = {
  idr: (v) => {
    if (v >= 1e12) return (v / 1e12).toFixed(2) + " T";
    if (v >= 1e9) return (v / 1e9).toFixed(2) + " M";
    if (v >= 1e6) return (v / 1e6).toFixed(1) + " jt";
    return v.toLocaleString("id-ID");
  },
  idrNum: (v) => { if (v >= 1e9) return (v/1e9).toFixed(1) + "M"; if (v >= 1e6) return (v/1e6).toFixed(1) + "jt"; return v.toLocaleString("id-ID"); }
};

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
const ProgressBar = ({ label, value, max, valueLabel, color }) => <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}><div style={{ fontSize: 12, color: "#7c85a0", width: 160, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div><div style={{ flex: 1, height: 6, background: "#1a1e2a", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "#22c55e", borderRadius: 3 }} /></div><div style={{ fontSize: 11, fontFamily: "monospace", color: "#7c85a0", width: 90, textAlign: "right", flexShrink: 0 }}>{valueLabel}</div></div>;

export const GmvMaxView = ({ filteredData, targetBrand }) => {
  const [activePage, setActivePage] = useState("overview");
  const rawData = filteredData?.gmvMax || [];

  // ==========================================
  // DATA PARSING & AGGREGATION ENGINE (REAL DATA)
  // ==========================================
  const data = useMemo(() => {
    let summary = { gmv: 0, spend: 0, orders: 0, creatives: rawData.length, deliveringCount: 0, notDeliveringCount: 0 };
    
    // Maps for aggregation
    const dailyMap = {};
    const statusMap = {};
    const campaignMap = {};
    const creatorMap = {};
    
    rawData.forEach(row => {
      const gmv = Number(row['Gross revenue'] || 0);
      const spend = Number(row['Cost'] || 0);
      const orders = Number(row['SKU orders'] || 0);
      const status = row['Status'] || 'Unknown';
      const campaign = row['Campaign name'] || 'Unnamed';
      const creator = row['TikTok account'] || 'Unknown Creator';
      const timeStr = row['Time posted'] || '';
      
      // Parse day for daily trend
      let day = "1";
      if (timeStr) {
        const dateObj = new Date(timeStr);
        if(!isNaN(dateObj)) day = dateObj.getDate().toString();
      }

      // Summary
      summary.gmv += gmv;
      summary.spend += spend;
      summary.orders += orders;
      if (status.includes('Delivering') && !status.includes('Not')) summary.deliveringCount++;
      if (status.includes('Not delivering')) summary.notDeliveringCount++;

      // Status
      if (!statusMap[status]) statusMap[status] = { name: status, count: 0, gmv: 0, spend: 0 };
      statusMap[status].count++;
      statusMap[status].gmv += gmv;
      statusMap[status].spend += spend;

      // Daily
      if (!dailyMap[day]) dailyMap[day] = { d: day, gmv: 0, spend: 0 };
      dailyMap[day].gmv += gmv;
      dailyMap[day].spend += spend;

      // Campaign
      if (!campaignMap[campaign]) campaignMap[campaign] = { name: campaign, gmv: 0, spend: 0, orders: 0 };
      campaignMap[campaign].gmv += gmv;
      campaignMap[campaign].spend += spend;
      campaignMap[campaign].orders += orders;

      // Creator
      if (!creatorMap[creator]) creatorMap[creator] = { name: creator, gmv: 0, spend: 0, videos: 0 };
      creatorMap[creator].gmv += gmv;
      creatorMap[creator].spend += spend;
      creatorMap[creator].videos += 1;
    });

    summary.roi = summary.spend > 0 ? summary.gmv / summary.spend : 0;
    summary.deliveryRate = summary.creatives > 0 ? (summary.deliveringCount / summary.creatives) * 100 : 0;

    // Daily Array Format
    let dailyArr = Object.values(dailyMap).sort((a,b) => parseInt(a.d) - parseInt(b.d));
    if (dailyArr.length === 0) dailyArr = [{d: "1", gmv: summary.gmv, spend: summary.spend}]; // Fallback
    dailyArr.forEach(d => d.roi = d.spend > 0 ? d.gmv / d.spend : 0);

    // Status Array Format
    let statusArr = Object.values(statusMap).sort((a,b) => b.count - a.count);
    statusArr.forEach(s => {
      s.roi = s.spend > 0 ? s.gmv / s.spend : null;
      s.pct = summary.creatives > 0 ? (s.count / summary.creatives) * 100 : 0;
      if(s.name.includes('Delivering')) s.color = "#22c55e";
      else if(s.name.includes('Not')) s.color = "#f59e0b";
      else if(s.name.includes('Auth')) s.color = "#ef4444";
      else s.color = "#38bdf8";
    });

    // Strategy & Rules for Campaigns
    let campaignArr = Object.values(campaignMap).sort((a,b) => b.gmv - a.gmv).slice(0, 50); // Top 50
    campaignArr.forEach(c => {
      c.roi = c.spend > 0 ? c.gmv / c.spend : 0;
      c.cat = c.name.toLowerCase().includes('skincare') || c.name.toLowerCase().includes('serum') ? 'Skincare' : 'Decorative';
      if(c.roi >= 4.0 && c.gmv > 10000000) c.action = 'scale';
      else if (c.roi >= 3.0 && c.gmv > 5000000) c.action = 'maintain';
      else if (c.roi < 2.0 && c.spend > 2000000) c.action = 'kill';
      else c.action = 'monitor';
    });

    // Strategy for Creators
    let creatorArr = Object.values(creatorMap).sort((a,b) => b.gmv - a.gmv).slice(0, 100);
    creatorArr.forEach(c => {
      c.roi = c.spend > 0 ? c.gmv / c.spend : 0;
      c.revPerVideo = c.videos > 0 ? c.gmv / c.videos : 0;
      if (c.roi >= 4.0 && c.gmv >= 10000000) c.tier = 'A';
      else if (c.roi >= 2.0 && c.gmv >= 5000000) c.tier = 'B';
      else c.tier = 'C';
    });

    return { summary, dailyArr, statusArr, campaignArr, creatorArr };
  }, [rawData]);

  const { summary, dailyArr, statusArr, campaignArr, creatorArr } = data;

  // ─── PAGE COMPONENTS WITH REAL DATA ───────────────────────
  
  const OverviewPage = window.OverviewPage = () => (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        <MetricCard label="GMV Dashboard" value={fmt.idr(summary.gmv)} sub="Live Drive Data" accent="#22c55e" />
        <MetricCard label="Total spend" value={fmt.idr(summary.spend)} sub="IDR ad cost" accent="#f59e0b" />
        <MetricCard label="Blended ROI" value={summary.roi.toFixed(2)+"x"} sub="Revenue ÷ spend" accent="#38bdf8" />
        <MetricCard label="Total orders" value={summary.orders.toLocaleString('id-ID')} sub="SKU orders" />
        <MetricCard label="Delivering rate" value={summary.deliveryRate.toFixed(1)+"%"} sub={`${summary.deliveringCount} / ${summary.creatives}`} accent="#a78bfa" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardHeading>Key insights (Live Data Engine)</CardHeading>
          {creatorArr[0] && <InsightCard type="good" title={`Top Creator: ${creatorArr[0].name} dominant (${fmt.idr(creatorArr[0].gmv)})`} body={`Creator ini menghasilkan ROI ${creatorArr[0].roi.toFixed(2)}x dari ${creatorArr[0].videos} video.`} />}
          <InsightCard type="warn" title={`${summary.notDeliveringCount} creative Not Delivering`} body={`Banyak list Not Delivering yang berpotensi bisa dipush ulang jika attribution ROI sebelumnya bagus.`} />
        </Card>
        <Card>
          <CardHeading>Campaign Health (Live)</CardHeading>
          <div style={{ fontSize: 52, fontWeight: 700, fontFamily: "monospace", color: summary.roi >= 4 ? "#22c55e" : "#f59e0b", lineHeight: 1 }}>
            {(summary.deliveryRate * 0.4 + (summary.roi/5)*60).toFixed(0)}
          </div>
          <div style={{ fontSize: 11, color: "#6b7a9c", marginTop: 3 }}>/ 100 health score (Algo: ROI + Delivery Rate)</div>
        </Card>
      </div>
    </div>
  );

  const TrendPage = window.TrendPage = () => {
    // Reusing the SVG chart logic dynamically
    const maxGmv = Math.max(...dailyArr.map((d) => d.gmv)) || 1;
    const yMax = Math.ceil(maxGmv / 50) * 50 || 100;
    const padding = { l: 48, r: 16, t: 16, b: 36 };
    const cw = 700 - padding.l - padding.r, ch = 240 - padding.t - padding.b;
    const bw = cw / (dailyArr.length || 1);

    return (
      <div className="fade-in">
        <Card style={{ marginBottom: 14 }}>
          <CardHeading>GMV & Spend Harian (Live)</CardHeading>
          <svg viewBox="0 0 700 240" style={{ width: "100%" }}>
            {dailyArr.map((d, i) => {
              const x = padding.l + i * bw + bw * 0.1;
              const bh = (d.gmv / yMax) * ch;
              const by = padding.t + ch - bh;
              return (
                <g key={d.d}>
                  <rect x={x} y={by} width={bw * 0.8} height={bh} fill={barRoiColor(d.roi)} opacity={0.82} rx={2} />
                  {i % 3 === 0 && <text x={x + (bw*0.8)/2} y={240 - 4} fontSize={9} fill="#3d4560" textAnchor="middle">{d.d}</text>}
                </g>
              );
            })}
            <polyline fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,4" points={dailyArr.map((d, i) => `${padding.l + i * bw + bw/2},${padding.t + ch - (d.spend / yMax)*ch}`).join(" ")} />
          </svg>
        </Card>
      </div>
    );
  };

  const CreativePage = window.CreativePage = () => (
    <div className="fade-in">
      <SectionLabel>Status distribution (Live)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {statusArr.map((s) => (
          <div key={s.name} style={{ background: "#0f1117", border: "0.5px solid #1e2330", borderRadius: 10, padding: 14, borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#4b5573", textTransform: "uppercase" }}>{s.name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.count.toLocaleString("id-ID")}</div>
            <div style={{ fontSize: 11, color: "#3d4560", marginTop: 4 }}>{s.pct.toFixed(1)}% · GMV {fmt.idrNum(s.gmv)}{s.roi ? ` · ROI ${s.roi.toFixed(2)}x` : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const CampaignPage = window.CampaignPage = () => (
    <Card className="fade-in">
      <CardHeading>Top 50 Campaigns (Live Order)</CardHeading>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Campaign", "Category", "Spend", "GMV", "ROI", "Orders", "Action"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#3d4560", borderBottom: "0.5px solid #1e2330" }}>{h}</th>)}</tr></thead>
          <tbody>
            {campaignArr.map((c) => {
              const ab = actionBadgeLabel[c.action] || actionBadgeLabel.monitor;
              return (
                <tr key={c.name}>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: "#c4c8d8" }}>{c.name}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}><span style={{ fontSize: 10, background: "#1a1e2a", color: "#9ca3af", padding: "2px 6px", borderRadius: 4}}>{c.cat}</span></td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}>{fmt.idrNum(c.spend)}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: "#22c55e" }}>{fmt.idrNum(c.gmv)}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: roiColor(c.roi) }}>{c.roi.toFixed(2)}x</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}>{c.orders.toLocaleString()}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}><span style={{ fontSize: 10, ...ab, padding: "2px 6px", borderRadius: 4 }}>{ab.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const CreatorsPage = window.CreatorsPage = () => (
    <Card className="fade-in">
      <CardHeading>Top Creators (Live Calculation)</CardHeading>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Creator", "GMV", "Spend", "ROI", "Videos", "Tier"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#3d4560", borderBottom: "0.5px solid #1e2330" }}>{h}</th>)}</tr></thead>
          <tbody>
            {creatorArr.map((c) => {
              const tc = tierColor[c.tier];
              return (
                <tr key={c.name}>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: "#c4c8d8" }}>{c.name}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: "#22c55e" }}>{fmt.idrNum(c.gmv)}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}>{fmt.idrNum(c.spend)}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720", color: roiColor(c.roi) }}>{c.roi.toFixed(2)}x</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}>{c.videos}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #141720" }}><span style={{ fontSize: 10, background: tc.bg, color: tc.text, padding: "2px 6px", borderRadius: 4 }}>Tier {c.tier}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const BoostRow = ({ creator }) => {
    const first = creator.name.charAt(0).toUpperCase();
    const as = { bg: "#1a1e2a", color: "#a0aec0", label: creator.action };
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#141720", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: "#1e2330", color: "#6b7a9c" }}>{first}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf0", width: 130, flexShrink: 0 }}>{creator.name}</div>
        <div style={{ fontSize: 11, color: "#6b7a9c", flex: 1 }}>{creator.detail}</div>
        <div style={{ fontSize: 11, fontFamily: "monospace", width: 50, textAlign: "right", color: roiColor(creator.roi), fontWeight: 600 }}>{creator.roi.toFixed(1)}x</div>
      </div>
    );
  };

  const BoostPage = window.BoostPage = () => {
    // Basic recommendation logic based on Live Creators
    const topRoas = creatorArr.filter(c => c.roi > 4.5 && c.spend > 1000000).sort((a,b) => b.roi - a.roi).slice(0, 5);
    const topGmv = creatorArr.filter(c => c.gmv > 50000000).sort((a,b) => b.gmv - a.gmv).slice(0, 5);
    
    return (
      <div className="fade-in">
        <InsightCard type="info" title="Boost framework Live Sync" body="Rekomendasi di-generate langsung dari data GDrive Anda." />
        <SectionLabel>Delivering → boost for GMV (volume play)</SectionLabel>
        {topGmv.map(c => <BoostRow key={c.name} creator={{ name: c.name, detail: `High Volume · Spend ${fmt.idrNum(c.spend)}`, roi: c.roi, action: "boostGmv" }} />)}
        <SectionLabel>Delivering → boost for ROAS (efficiency play)</SectionLabel>
        {topRoas.map(c => <BoostRow key={c.name} creator={{ name: c.name, detail: `Efficiency Scale · GMV ${fmt.idrNum(c.gmv)}`, roi: c.roi, action: "scaleRoas" }} />)}
      </div>
    );
  };

  const STATIC_ACTIONS = [
    { id: 1, priority: "critical", num: "01", title: `Collect & renew Sparks Code untuk ${summary.notDeliveringCount} video stuck`, desc: "Punya potensi GMV tapi saat ini Not Delivering.", tags: ["Critical"], detail: "Minta renewal Sparks Code 365 hari.", steps: ["Export list", "Group per creator", "Input ke Ads Manager"] },
    { id: 2, priority: "high", num: "02", title: "Trial boost 2 jam untuk materi baru", desc: "Push traffic awal.", tags: ["High"], detail: "Boost ringan 50rb per campaign", steps: ["Pilih campaign", "Set budget trial", "Review hasil 24 jam"] }
  ];

  const ActionItem = ({ item }) => {
    const [open, setOpen] = useState(false);
    const c = actionColors[item.priority] || actionColors.high;
    return (
      <div style={{ background: "#0f1117", border: `0.5px solid ${open ? "#2a3050" : "#1e2330"}`, borderRadius: 12, marginBottom: 8, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "monospace", background: c.bg, color: c.text, border: `1px solid ${c.accent}40` }}>{item.num}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", marginBottom: 3 }}>{item.title}</div><div style={{ fontSize: 12, color: "#6b7a9c", lineHeight: 1.5 }}>{item.desc}</div></div>
          <span style={{ fontSize: 12, color: "#3d4560", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
        {open && <div style={{ borderTop: "0.5px solid #1e2330", padding: "14px 18px 16px 62px" }}><div style={{ fontSize: 12, color: "#6b7a9c" }}>{item.detail}</div></div>}
      </div>
    );
  };

  const ActionPage = window.ActionPage = () => (
    <div className="fade-in">
      <SectionLabel>Recommended Actions (Live Derived)</SectionLabel>
      {STATIC_ACTIONS.map(item => <ActionItem key={item.id} item={item} />)}
    </div>
  );

  const TargetsPage = window.TargetsPage = () => {
    const [targetGmv, setTargetGmv] = useState(5.0);
    const [targetRoi, setTargetRoi] = useState(4.5);
    const reqSpend = targetGmv / targetRoi;
    
    return (
      <div className="fade-in">
        <Card style={{ marginBottom: 16 }}>
          <CardHeading>Custom target calculator (Bulan Depan vs Data Asli Saat Ini)</CardHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>Target GMV bulan depan (T IDR)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="range" min={2} max={10} step={0.5} value={targetGmv} onChange={(e) => setTargetGmv(parseFloat(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: "#22c55e", minWidth: 50 }}>{targetGmv.toFixed(1)} T</span>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8, marginTop: 20 }}>Target ROI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="range" min={3} max={7} step={0.1} value={targetRoi} onChange={(e) => setTargetRoi(parseFloat(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: "#38bdf8", minWidth: 50 }}>{targetRoi.toFixed(1)}x</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Required spend", `${reqSpend.toFixed(2)} T IDR`, "#f59e0b"],
                ["Required spend/day", `${((reqSpend / 30) * 1000).toFixed(0)} jt / hari`, "#f59e0b"],
                ["vs current GMV", `${((targetGmv / (summary.gmv/1e12)) * 100).toFixed(0)}%`, targetGmv > (summary.gmv/1e12) ? "#22c55e" : "#ef4444"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: "#141720", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#7c85a0" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const PAGES = [
    { id: "overview", label: "Overview", icon: "⬡", component: OverviewPage },
    { id: "trend", label: "Daily trend", icon: "↗", component: TrendPage },
    { id: "creative", label: "Creative pool", icon: "⊞", component: CreativePage },
    { id: "campaign", label: "Campaigns", icon: "◈", component: CampaignPage },
    { id: "creators", label: "Creators", icon: "◎", component: CreatorsPage },
    { id: "boost", label: "Boost Automation", icon: "⚡", component: BoostPage },
    { id: "actions", label: "Action plan", icon: "✦", component: ActionPage },
    { id: "targets", label: "Targets Simulator", icon: "◎", component: TargetsPage },
  ];

  const ActiveComponent = PAGES.find((p) => p.id === activePage)?.component || OverviewPage;

  return (
    <div style={{ display: "flex", flex: 1, minHeight: "100vh", background: "#07080a", color: "#e8eaf0", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
      {/* INTERNAL NAVIGATION TABS */}
      <div style={{ width: 210, flexShrink: 0, borderRight: "0.5px solid #1a1e2a", padding: "20px 10px", background: "#0e1014" }}>
        <div style={{ marginBottom: 20, paddingLeft: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>GMV Max</div>
          <div style={{ fontSize: 10, color: "#3d4560" }}>Live Data Engine Active</div>
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

      {/* RENDER CONTENT */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto", position: 'relative' }}>
          <ActiveComponent />
      </div>
    </div>
  );
}
