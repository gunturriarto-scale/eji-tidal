import React from "react";

export const GmvMaxView = () => (
  <div style={{
    margin: '-2.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  }}>
    <iframe
      src="/gmvmax.html"
      style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: '100vh' }}
      title="GMV Max Intelligence"
    />
  </div>
);

export default GmvMaxView;
