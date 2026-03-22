import React from 'react';

const GoogleTrendsWidget = ({ keywords = ["hanasui", "skintific", "glad2glow"], geo = "ID", time = "today 12-m" }) => {
  // Construct the HTML for the iframe
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
          #widget-container { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="widget-container"></div>
        <script type="text/javascript" src="https://ssl.gstatic.com/trends_nrtr/4356_RC01/embed_loader.js"></script>
        <script type="text/javascript">
          window.onload = function() {
            if (window.trends && window.trends.embed) {
              window.trends.embed.renderExploreWidget(
                "TIMESERIES", 
                {
                  "comparisonItem": ${JSON.stringify(keywords.map(kw => ({ "keyword": kw, "geo": geo, "time": time })))},
                  "category": 0,
                  "property": ""
                }, 
                {
                  "exploreQuery": "geo=${geo}&q=${keywords.join(',')}&date=${keywords.map(() => time).join(',')}",
                  "guestPath": "https://trends.google.com/trends/embed/"
                },
                document.getElementById('widget-container')
              );
            }
          };
        </script>
      </body>
    </html>
  `;

  return (
    <div className="glass-panel chart-container full-width" style={{ marginTop: '2rem', minHeight: '500px', padding: '1rem', overflow: 'hidden' }}>
      <div className="chart-header">
        <h3>Live Google Trends Data (Isolated)</h3>
        <p>Real-time interest comparison (Iframe Isolated)</p>
      </div>
      <div style={{ width: '100%', height: '450px', position: 'relative' }}>
        <iframe
          title="Google Trends"
          srcDoc={srcDoc}
          style={{
            width: '100%',
            height: '450px',
            border: 'none',
            background: 'white', // Trends widget usually has a white background
            borderRadius: '8px'
          }}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
};

export default GoogleTrendsWidget;
