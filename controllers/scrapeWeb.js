const puppeteer = require("puppeteer");
require("dotenv").config();
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
  console.log('_____ path', puppeteer.executablePath())

  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const page = await browser.newPage();

    await page.goto(url);

    const sanitizedFilename = sanitizeUrlToFilename(url);
    const snapshotPath = path.join(__dirname, '../snapshots', `${sanitizedFilename}.json`);

    const snapshotsDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    let previousArticles = [];
    if (fs.existsSync(snapshotPath)) {
      previousArticles = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    }

    const currentArticles = await page.evaluate((selectors) => {
      const results = [];
      const articleElements = document.querySelectorAll(selectors.articleSelector);

      function extractText(ele, selector) {
        if (selector?.includes('-n-')) {
          const [item, index] = selector.split('-n-');
          return ele.querySelectorAll(item)?.[index - 1];
        } else {
          return ele.querySelector(selector);
        }
      }

      articleElements.forEach((element) => {
        const link = extractText(element, selectors.linkSelector)?.href ||
          extractText(element, selectors.linkSelector)
            ?.getAttribute('onclick')
            ?.match(/'([^']+)'/)?.[1] || '';
        const title = extractText(element, selectors.nameSelector)?.innerText || '';
        const pubDate =
          extractText(element, selectors.dateSelector)?.innerText?.replace('Publish Date : ', '') ||
          '';
        const contentSnippet = extractText(element, selectors.contentSelector)?.innerText || '';
        if (link) {
          results.push({ link, title, pubDate, contentSnippet });
        }
      });

      return results;
    }, selectors);

    const newArticles = currentArticles.filter((currentArticle) => {
      return !previousArticles.some(
        (prevArticle) =>
          prevArticle.link === currentArticle.link &&
          prevArticle.title === currentArticle.title &&
          prevArticle.pubDate === currentArticle.pubDate &&
          prevArticle.contentSnippet === currentArticle.contentSnippet
      );
    });

    if (newArticles.length > 0) {
      console.log(`New/Updated articles found on: ${url}`, newArticles);

      // Append new articles to previousArticles
      previousArticles.push(...newArticles);

      // Save updated snapshot
      fs.writeFileSync(snapshotPath, JSON.stringify(previousArticles, null, 2));
    } else {
      console.log(`No new or updated articles on: ${url}`);
    }

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
    console.log('ERROR ----', error)
    return null;
  }
}

module.exports = { fetchAndCompare };
