const express = require('express');
const axios = require('axios');
const RSSParser = require('rss-parser');
const moment = require('moment'); // Add moment for date manipulation
const cors = require('cors'); // Import CORS middleware
const fetchRSSFeeds = require('./controllers/fetchRss');
const createNotifications = require('./utils/supabaseHelpers');

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// const cron = require('cron').CronJob;
// const nodemailer = require('nodemailer');
const { diff_match_patch } = require('diff-match-patch');

const app = express();
const port = process.env.PORT || 8000;


// Enable CORS for all origins (you can configure specific origins if needed)
app.use(cors());


async function fetchAndCompare(url) {
  const browser = await puppeteer.launch({
    args: ['--disable-http2'],
    headless: false
  });
  const page = await browser.newPage();

  // Set a custom user agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();  // Get the page content (HTML)
    console.log('----', content);

    // Store snapshot in the root level of the project directory
    const snapshotPath = path.join(__dirname, 'snapshot.txt');  // __dirname points to the current directory (root level)
    let previousContent = '';
    if (fs.existsSync(snapshotPath)) {
      previousContent = fs.readFileSync(snapshotPath, 'utf-8');
    }

    // Compare the current content with the previous content
    const dmp = new diff_match_patch();
    const diff = dmp.diff_main(previousContent, content);
    dmp.diff_cleanupSemantic(diff);

    if (diff.length > 1) {  // Detect if there's any significant change
      console.log('Change detected!');
      // sendNotification(url);  // Notify if change detected
      // Save the new content as the snapshot
    } else {
      console.log('No change detected.');
    }
    fs.writeFileSync(snapshotPath, content);
  } catch (error) {
    console.error('Error navigating or scraping the page:', error);
  } finally {
    await browser.close();
  }
}


app.get('/', async (req, res) => {
  res.status(200).json('Up & Working');
});

// Route to trigger the fetching process and send JSON response
app.get('/fetch-alerts', async (req, res) => {
  try {
    console.log('Fetching alerts...');  // Check if this gets logged
    const feeds = await fetchRSSFeeds();
    const { error } = createNotifications(feeds);
    if(error){
      return res.status(500).json({ success: false, message: error.message });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /fetch-alerts route:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

app.get('/api/get-notifications', async (req, res) => {
  try {
    const { getAllNotifications } = require('./utils/supabaseHelpers');

    const { data, error } = await getAllNotifications();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// fetchAndCompare('https://www.nseindia.com/invest/investors-regulatory-actions');
