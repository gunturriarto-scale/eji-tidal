import https from 'https';

const API_KEY = "AIzaSyBT6vXs5dDw4myaI7O_JQjvisKz8yYWWe4";

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        const generateModels = json.models.filter(m => 
          m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        console.log("AVAILABLE MODELS FOR generateContent:");
        generateModels.forEach(m => console.log(" -", m.name));
      } else {
        console.log("RESPONSE:", JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log("Error parsing:", data);
    }
  });
});
req.on('error', error => console.error(error));
req.end();
