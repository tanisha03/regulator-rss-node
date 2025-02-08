const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const RSSParser = require('rss-parser');
const moment = require('moment'); // Add moment for date manipulation
const cors = require('cors'); // Import CORS middleware
const multer = require("multer");
const { fetchRSSFeeds } = require('./controllers/fetchRss');
const { fetchAndCompare } = require('./controllers/scrapeWeb');
const upload = multer({ dest: "uploads/" });
const { processContract } = require("./controllers/extractContract");
const http = require('http');

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// const cron = require('cron').CronJob;
// const nodemailer = require('nodemailer');
const { diff_match_patch } = require('diff-match-patch');

const app = express();
const port = process.env.PORT || 8000;

dotenv.config();

// Enable CORS for all origins (you can configure specific origins if needed)
app.use(cors());

const server = http.createServer(app);

app.get('/', async (req, res) => {
  res.status(200).json('Up & Working');
});

// Route to trigger the fetching process and send JSON response
app.get('/fetch-alerts', async (req, res) => {
  try {
    console.log('Fetching alerts and checking changes...');

    // Fetch RSS feeds and content changes
    const feeds = await fetchRSSFeeds();
    const data = await fetchAndCompare();

    const changeData = [
      ...feeds,
      ...(data || [])
    ];

    if(changeData.length) {
      // Combine feeds and changes to create notifications
      const { createNotifications } = require('./utils/supabaseHelpers');

      const notificationsData = await createNotifications(changeData);

      if (notificationsData?.error) {
        console.error('Error creating notifications:', notificationsData.error);
        return res.status(500).json({ success: false, message: notificationsData.error.message });
      }
    }

    // Respond with combined data
    res.status(200).json({
      success: true,
      feeds: changeData,
    });
  } catch (error) {
    console.error('Error in /fetch-alerts route:', error);
    res.status(500).json({ message: 'Error fetching alerts or creating notifications' });
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

app.post("/process-contract", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);

  try {
    const result = await processContract(filePath); // Your function to process the PDF
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

// app.get('/api/test', async (req, res) => {
//   try {
//     const sanitizedFilename = sanitizeUrlToFilename('https://enforcementdirectorate.gov.in/press-release');
//     console.log('Sanitized filename:', sanitizedFilename);
//     const { getSnapshot } = require('./utils/supabaseHelpers');
//     const res = await getSnapshot(sanitizedFilename);
//     console.log('++++++ res', res);
//     // const snapshotPath = path.join(__dirname, '../snapshots', `${sanitizedFilename}.json`);
//   } catch (error) {
//     console.error('Error fetching test:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});