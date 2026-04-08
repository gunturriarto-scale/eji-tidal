import React, { useState } from 'react';
import './GmvMaxView.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const GmvMaxView = ({ filteredData, targetBrand = "Hanasui" }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const gmvData = filteredData?.gmvMax || [];

  let totalGMV = 0;
  let totalSpend = 0;
  let totalOrders = 0;
  let deliveringCount = 0;
  let notDeliveringCount = 0;
  let notDeliveringGmv = 0;
  
  gmvData.forEach(row => {
     let cost = Number(row['Cost'] || 0);
     let rev = Number(row['Gross revenue'] || 0);
     let orders = Number(row['SKU orders'] || 0);
     
     totalSpend += cost;
     totalGMV += rev;
     totalOrders += orders;
     
     if (row['Status'] === 'Delivering') deliveringCount++;
     else if (row['Status'] === 'Not Delivering') {
        notDeliveringCount++;
        notDeliveringGmv += rev;
     }
  });

  const blendedROI = totalSpend > 0 ? (totalGMV / totalSpend).toFixed(2) : '0.00';
  const deliveryRate = gmvData.length > 0 ? ((deliveringCount / gmvData.length) * 100).toFixed(1) : '0.0';

  const formatIDR = (val) => {
    if (val >= 1000000000000) return (val / 1000000000000).toFixed(2) + ' T';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' jt';
    return (val).toLocaleString('id-ID');
  };

  // Hardcoded for now based on your file matching the initial styling.
  // Next, we will connect this data to our Google Drive script result.
  const chartData = [
    { name: 'Mar 1', gmv: 299.4, roi: 4.42 },
    { name: 'Mar 7', gmv: 208.4, roi: 4.62 },
    { name: 'Mar 14', gmv: 105.4, roi: 4.94 },
    { name: 'Mar 21', gmv: 78.3, roi: 4.14 },
    { name: 'Mar 28', gmv: 18.6, roi: 8.36 },
  ];

  return (
    <div className="gmv-max-view fade-in">
      <div className="gmv-max-view-nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'trend' ? 'active' : ''} onClick={() => setActiveTab('trend')}>Daily Trend</button>
        <button className={activeTab === 'campaign' ? 'active' : ''} onClick={() => setActiveTab('campaign')}>Campaigns</button>
        <button className={activeTab === 'creators' ? 'active' : ''} onClick={() => setActiveTab('creators')}>Creators</button>
      </div>

      {activeTab === 'overview' && (
        <div className="fade-in">
          <div className="kpi-grid">
            <div className="kpi gr">
              <div className="kpi-lbl">GMV</div>
              <div className="kpi-val gr">{formatIDR(totalGMV)}</div>
              <div className="kpi-sub">IDR Gross Revenue</div>
              <div className="kpi-trend up">▲ Real-time</div>
            </div>
            <div className="kpi am">
              <div className="kpi-lbl">Total Spend</div>
              <div className="kpi-val am">{formatIDR(totalSpend)}</div>
              <div className="kpi-sub">IDR Ad Cost</div>
              <div className="kpi-trend dn">▼ Live Data</div>
            </div>
            <div className="kpi bl">
              <div className="kpi-lbl">Blended ROI</div>
              <div className="kpi-val bl">{blendedROI}x</div>
              <div className="kpi-sub">Rev ÷ Spend</div>
              <div className="kpi-trend up">▲ Target: 4.40x</div>
            </div>
            <div className="kpi pk">
              <div className="kpi-lbl">Total Orders</div>
              <div className="kpi-val pk">{totalOrders.toLocaleString('id-ID')}</div>
              <div className="kpi-sub">SKU Orders</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Delivering Rate</div>
              <div className="kpi-val" style={{color:'#fff'}}>{deliveryRate}%</div>
              <div className="kpi-sub">{deliveringCount.toLocaleString('id-ID')} dari {gmvData.length.toLocaleString('id-ID')}</div>
              <div className="kpi-trend up">▲ Healthy</div>
            </div>
          </div>

          <div className="g60">
            <div>
              <div className="sec-lbl">Key Insights — March 2026</div>
              <div className="ins-card good">
                <div className="ins-hd"><span className="ins-icon">✅</span><span className="ins-title">ininia9 dominasi: 479,7 jt GMV (10.9% dari total), ROI 3.66x</span></div>
                <div className="ins-body">Satu creator ini menghasilkan hampir 11% dari seluruh GMV Maret dengan konsistensi di 4 video sekaligus delivering.</div>
              </div>
              <div className="ins-card warn">
                <div className="ins-hd"><span className="ins-icon">⚠️</span><span className="ins-title">{notDeliveringCount.toLocaleString('id-ID')} creative Not Delivering</span></div>
                <div className="ins-body">{notDeliveringCount.toLocaleString('id-ID')} creatives Not Delivering dengan total historical GMV {formatIDR(notDeliveringGmv)}. Rekomendasi: Boost trial 2 jam untuk materi ini.</div>
              </div>
              <div className="ins-card crit">
                <div className="ins-hd"><span className="ins-icon">🔴</span><span className="ins-title">Collagen Water Sunscreen ROI 2.93x — terendah</span></div>
                <div className="ins-body">Hanya campaign ini yang spend &gt;5jt dengan ROI di bawah 3x. Perlu evaluasi materi promosi secepatnya.</div>
              </div>
            </div>

            <div>
               <div className="sec-lbl">Campaign Health Score</div>
               <div className="gmv-card mb">
                  <div className="gauge-wrap">
                    <div className="gauge-score">
                      <div className="gauge-num" style={{color:'var(--green)'}}>
                         {deliveryRate > 25 && blendedROI >= 4.0 ? '85' : '65'}
                      </div>
                      <div className="gauge-label">Health Score</div>
                    </div>
                    <div className="gauge-bar-wrap">
                      <div style={{fontSize:'11px', color:'var(--text2)', marginBottom:'6px'}}>Komposit dari Delivering Rate, ROI efficiency, dan Creative Supply</div>
                      <div className="gauge-bar"><div className="gauge-fill" style={{width: deliveryRate > 25 && blendedROI >= 4.0 ? '85%' : '65%'}}></div></div>
                    </div>
                  </div>
               </div>

               <div className="sec-lbl">Category Performance</div>
               <div className="gmv-card mb">
                 <div className="gmv-card-hd">GMV by Category</div>
                 <div className="pb-row"><span className="pb-lbl">🎨 Decorative</span><div className="pb-track"><div className="pb-fill" style={{width:'100%',background:'var(--pink)'}}></div></div><span className="pb-val pk">2,78 T · 4.30x</span></div>
                 <div className="pb-row"><span className="pb-lbl">🧴 Skincare</span><div className="pb-track"><div className="pb-fill" style={{width:'37%',background:'var(--blue)'}}></div></div><span className="pb-val b">1,03 T · 4.23x</span></div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="fade-in">
           <div className="gmv-card mb" style={{ height: '300px' }}>
              <div className="gmv-card-hd">Daily GMV Trend — March 2026</div>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                      <defs>
                          <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10e07a" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10e07a" stopOpacity={0} />
                          </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#3d4560" tick={{fontSize: 10}} />
                      <YAxis stroke="#3d4560" tick={{fontSize: 10}} />
                      <Tooltip contentStyle={{background:'#14171d', border:'1px solid rgba(255,255,255,0.1)'}} />
                      <Area type="monotone" dataKey="gmv" stroke="#10e07a" fillOpacity={1} fill="url(#colorGmv)" />
                  </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}

      {activeTab === 'campaign' && (
        <div className="fade-in gmv-card mb">
           <div className="gmv-card-hd">Top Campaign Performance</div>
           <div className="scroll-x">
               <table className="tbl">
                   <thead>
                       <tr><th>Campaign</th><th>Category</th><th>Spend</th><th>GMV</th><th>ROI</th><th>Status</th></tr>
                   </thead>
                   <tbody>
                       <tr><td>[EXCLUSIVE CREATOR] Next Level</td><td><span className="badge bpk">Decorative</span></td><td className="mono">290,9 jt</td><td className="mono g">1.249,5 jt</td><td className="mono g">4.30x</td><td><span className="badge bg">✓ Scale</span></td></tr>
                       <tr><td>Next Level Butter Balm Tint</td><td><span className="badge bpk">Decorative</span></td><td className="mono">148,4 jt</td><td className="mono g">563,9 jt</td><td className="mono g">3.80x</td><td><span className="badge bg">✓ Maintain</span></td></tr>
                   </tbody>
               </table>
           </div>
        </div>
      )}
    </div>
  );
};
