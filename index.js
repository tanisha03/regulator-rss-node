const express = require('express');
const axios = require('axios');
const RSSParser = require('rss-parser');
const moment = require('moment'); // Add moment for date manipulation
const cors = require('cors'); // Import CORS middleware

const app = express();
const port = process.env.PORT || 8000;

const rssParser = new RSSParser();

// Enable CORS for all origins (you can configure specific origins if needed)
app.use(cors());

// List of RSS feed URLs
const rssFeeds = [
  { name: 'RBI Press Releases', url: 'https://rbi.org.in/pressreleases_rss.xml' },
  { name: 'RBI Press Notifications', url: 'https://rbi.org.in/notifications_rss.xml' },
  { name: 'RBI Press Publications', url: 'https://rbi.org.in/Publication_rss.xml' },
  { name: 'SEBI', url: 'https://www.sebi.gov.in/sebirss.xml' },
  { name: 'Services India', url: 'https://services.india.gov.in/feed/rss?cat_id=10&ln=en' },
  { name: 'Tax', url: 'https://tax.cyrilamarchandblogs.com/feed/' },
];

function preprocessSEBIPubDate(pubDateString) {
    // Handle the comma in SEBI's date format: "12 Dec, 2024 +0530"
    if (pubDateString.includes(',')) {
      return pubDateString.replace(',', '');
    }
    return pubDateString;
  }

// Function to fetch and parse RSS feeds
async function fetchRSSFeeds(feeds, startDate, endDate) {
  const feedData = [];

  // Iterate through all feeds
  for (const feed of feeds) {
    try {
      console.log(`Fetching feed: ${feed.name}`);
      const response = await axios.get(feed.url);
      const parsedFeed = await rssParser.parseString(response.data);

      console.log(`Parsed Feed for ${feed.name}:`, startDate, endDate);  // Log the entire parsed feed


      const startDateUTC = moment.utc(startDate); 
      const endDateUTC = moment.utc(endDate); 

      // Filter items based on startDate and endDate
      const feedItems = parsedFeed.items
        .filter(item => {
          let pubDateString = preprocessSEBIPubDate(item.pubDate);
          const pubDateUTC = moment.utc(pubDateString, "DD MMM YYYY HH:mm:ss Z");  // Use the custom format for SEBI
          return pubDateUTC.isBetween(startDateUTC, endDateUTC, null, '[]');
        })
        .map(item => ({
          source: feed.name,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet || ''
        }));

      feedData.push(...feedItems);
    } catch (error) {
      console.error(`Failed to fetch or parse feed from ${feed.name}:`, error.message);
      // Skip the failed feed and continue with others
    }
  }

  return feedData;
}

app.get('/', async (req, res) => {
  res.status(200).json('Up & Working');
});

// Route to trigger the fetching process and send JSON response
app.get('/fetch-alerts', async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    let parsedStartDate;
    let parsedEndDate = moment(); // Default to the current time
    
    // Validate and calculate date range based on the timeRange query
    if (timeRange) {
      parsedStartDate = moment().subtract(Number(timeRange.replace('h', '')), 'hours');
    } else {
      parsedStartDate = moment().subtract(24, 'hours'); // Default to 24 hours
    }

    // Fetch RSS feed data with the selected date range
    const feeds = await fetchRSSFeeds(rssFeeds, parsedStartDate, parsedEndDate);

    // Generate output
    const output = {
      generatedAt: new Date().toISOString(),
      alerts: feeds
    };

    // Send the JSON response
    res.status(200).json(output);

  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'An error occurred while fetching alerts', error: error.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
