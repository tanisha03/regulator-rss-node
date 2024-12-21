async function fetchAndCompare(url) {
    const browser = await puppeteer.launch({
      args: ['--disable-http2'],
      headless: true // Set headless to true for production
    });
    const page = await browser.newPage();
  
    // Set a custom user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.content();  // Get the page content (HTML)
  
      // Define the snapshot file path for each URL based on its name
      const snapshotPath = path.join(__dirname, 'snapshots', `${url.replace(/^https?:\/\//, '').replace(/\//g, '_')}.txt`);
      let previousContent = '';
      if (fs.existsSync(snapshotPath)) {
        previousContent = fs.readFileSync(snapshotPath, 'utf-8');
      }
  
      // Compare the current content with the previous content using diff_match_patch
      const dmp = new diff_match_patch();
      const diff = dmp.diff_main(previousContent, content);
      dmp.diff_cleanupSemantic(diff);
  
      if (diff.length > 1) {  // If there's a significant change, we detect it
        console.log(`Change detected on: ${url}`);
        // You can send a notification here if needed (email, webhook, etc.)
      } else {
        console.log(`No change detected on: ${url}`);
      }
  
      // Save the new content as the snapshot
      fs.writeFileSync(snapshotPath, content);
    } catch (error) {
      console.error('Error navigating or scraping the page:', error);
    } finally {
      await browser.close();
    }
}

module.exports = fetchAndCompare;
