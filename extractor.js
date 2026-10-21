const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  let capturedStreams = [];

  // Network traffic capture
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.m3u8') || url.includes('/hls/')) {
      if (!capturedStreams.some(s => s.url === url)) {
        capturedStreams.push({
          channel: 'beIN Sports HD',
          url: url,
          updated_at: new Date().toISOString()
        });
      }
    }
  });

  try {
    // Target portal ya authorized web player URL
    await page.goto('https://live.api-live.workers.dev/?id=beIN3', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('Extraction error:', err.message);
  }

  await browser.close();

  // Save to JSON
  if (capturedStreams.length > 0) {
    const outputData = {
      status: 'success',
      matches: capturedStreams
    };
    fs.writeFileSync('streams.json', JSON.stringify(outputData, null, 2));
    console.log('Streams saved successfully.');
  } else {
    console.log('No streams captured in this run.');
  }
})();
