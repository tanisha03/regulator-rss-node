const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { scrapeWeb } = require('../utils/constants');

function sanitizeUrlToFilename(url) {
  return url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\//g, '_') // Replace slashes
    .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace non-alphanumeric chars
}

async function scrapeWeblink({ url, selectors, source }) {
  const browser = await puppeteer.launch({
    args: ['--disable-http2'],
    headless: true
  });
  const page = await browser.newPage();

  // Set a custom user agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content(); // Get the page content (HTML)

    // Define the snapshot file path for each URL based on its name
    const sanitizedFilename = sanitizeUrlToFilename(url);
    const snapshotPath = path.join(__dirname, '../snapshots', `${sanitizedFilename}.json`);

    const snapshotsDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true }); // Create the directory if it doesn't exist
    }

    // Load the previous articles snapshot (JSON format)
    let previousArticles = [];
    if (fs.existsSync(snapshotPath)) {
      previousArticles = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    }

    // Extract article details
    const currentArticles = await page.evaluate((selectors) => {
      const results = [];
      const articleElements = document.querySelectorAll(selectors.articleSelector);

      function extractText(ele, selector) {
        if(selector?.includes('-n-')){
          const [ item, index ] = selector.split('-n-'); 
          return ele.querySelectorAll(item)?.[index-1];
        } else return ele.querySelector(selector);
      }

      // if(source === 'Central Board Of Indirect Taxes & Customs')
      // console.log('~~~~~~ here', articleElements);

      articleElements.forEach((element) => {
        const link = extractText(element, selectors.linkSelector)?.href || extractText(element, selectors.linkSelector)?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] ||'';
        const title = extractText(element, selectors.nameSelector)?.innerText || '';
        const pubDate = extractText(element, selectors.dateSelector)?.innerText?.replace('Publish Date : ', '') || new Date().getTime();
        const contentSnippet = extractText(element, selectors.contentSelector)?.innerText || '';
        if (link) {
          results.push({ link, title, pubDate, contentSnippet });
        }
      });

      return results;
    }, selectors);

    // Detect new or updated articles
    const newArticles = currentArticles.filter((currentArticle) => {
      // Check if the current article exists in the previous snapshot
      const isExisting = previousArticles.some((prevArticle) => {
        return (
          prevArticle.link === currentArticle.link && // Match by link
          prevArticle.name === currentArticle.name && // Match by name
          prevArticle.date === currentArticle.date && // Match by date
          prevArticle.content === currentArticle.content // Match by content
        );
      });

      return !isExisting; // Include only new or updated articles
    });

    if (newArticles.length > 0) {
      console.log(`New/Updated articles found on: ${url}`, newArticles);
    } else {
      console.log(`No new or updated articles on: ${url}`);
    }

    // Save the current articles as the snapshot
    fs.writeFileSync(snapshotPath, JSON.stringify(currentArticles, null, 2));
    return newArticles.map((article) => ({ ...article, source }));
  } catch (error) {
    console.error('Error navigating or scraping the page:', error);
    return [];
  } finally {
    await browser.close();
  }
}

async function fetchAndCompare() {
  try {
    const allNewArticles = [];

    for (const feed of scrapeWeb) {
      const { url, selectors, name: source } = feed;
      const newArticles = await scrapeWeblink({ url, selectors, source });
      allNewArticles.push(...newArticles);
    }

    return allNewArticles;
  } catch (error) {
   return {error: error};
  }
}

module.exports = { fetchAndCompare };
