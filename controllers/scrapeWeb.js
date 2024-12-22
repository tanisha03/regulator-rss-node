const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { diff_match_patch } = require('diff-match-patch');

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

      articleElements.forEach((element) => {
        const link = element.querySelector(selectors.linkSelector)?.href || '';
        const title = element.querySelector(selectors.nameSelector)?.innerText || '';
        const pubDate = element.querySelector(selectors.dateSelector)?.innerText || '';
        const contentSnippet = element.querySelector(selectors.contentSelector)?.innerText || '';
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
  

const scrapeWeb = [
  {
    name: 'ITR',
    url: 'https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Press%20Release',
    selectors: {
      articleSelector: '.itemdiv',
      linkSelector: '.mainlink',
      nameSelector: '.mainlink',
      dateSelector: null,
      contentSelector: '.rssLink'
    }
  },
  {
    name: 'ITR',
    url: 'https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Latest%20Tax%20Updates',
    selectors: {
      articleSelector: '.itemdiv',
      linkSelector: '.mainlink',
      nameSelector: '.mainlink',
      dateSelector: null,
      contentSelector: '.rssLink'
    }
  },
  {
    name: 'BSE',
    url: 'https://www.bseindia.com/investor_relations/announcement.html',
    selectors: {
      articleSelector: '.ng-scope',
      linkSelector: '.tablebluelink',
      nameSelector: 'a',
      dateSelector: null,
      contentSelector: null
    }
  },
  {
    name: 'BSE',
    url: 'https://www.bseindia.com/investor_relations/corporategovernance.html',
    selectors: {
      articleSelector: '.ng-scope',
      linkSelector: '.tablebluelink',
      nameSelector: '.ng-binding',
      dateSelector: null,
      contentSelector: null
    }
  },
  {
    name: 'FSSAI',
    url: 'https://fssai.gov.in/notifications.php',
    selectors: {
      articleSelector: '.grouptr12',
      linkSelector: 'a',
      nameSelector: 'strong',
      dateSelector: null,
      contentSelector: null
    }
  },
  {
    name: 'FSSAI',
    url: 'https://fssai.gov.in/advisories.php',
    selectors: {
      articleSelector: '.odd',
      linkSelector: 'a',
      nameSelector: 'td',
      dateSelector: null,
      contentSelector: null
    }
  },
  {
    name: 'Directorate of Enforcement',
    url: 'https://enforcementdirectorate.gov.in/press-release',
    selectors: {
      articleSelector: 'tr',
      linkSelector: 'a',
      nameSelector: '.views-field views-field-field-press-release-title',
      dateSelector: '.views-field views-field-field-date-of-release',
      contentSelector: null
    }
  },
  {
    name: 'Central Board Of Indirect Taxes & Customs',
    url: 'https://www.cbic.gov.in/entities/whatsNew',
    selectors: {
      articleSelector: '.card solution_card',
      linkSelector: 'a',
      nameSelector: 'p',
      dateSelector: '.date-time-stamp',
      contentSelector: null
    }
  },
  {
    name: 'DGFT',
    url: 'https://www.dgft.gov.in/CP/?opt=notification',
    selectors: {
      articleSelector: 'tr',
      linkSelector: 'a',
      nameSelector: 'td',
      dateSelector: '.sorting_1',
      contentSelector: null
    }
  }
];

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
