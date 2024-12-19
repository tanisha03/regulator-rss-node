const axios = require('axios');
const RSSParser = require('rss-parser');
const moment = require('moment'); // Add moment for date manipulation

const rssParser = new RSSParser();

// List of RSS feed URLs
const rssFeeds = [
  { name: 'RBI', url: [
    'https://rbi.org.in/pressreleases_rss.xml', 
    'https://rbi.org.in/notifications_rss.xml', 
    'https://rbi.org.in/Publication_rss.xml'
  ]},
  { name: 'SEBI', url: ['https://www.sebi.gov.in/sebirss.xml'] },
  // { name: 'NSE', url: [
  //   'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Corporate_Governance.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Insider_Trading.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Offer_Documents.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Sast_Regulation29.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Secretarial_Compliance.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Sast_Regulation31.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Shareholding_Pattern.xml',
  //   'https://nsearchives.nseindia.com/content/RSS/Circulars.xml'
  // ]},
//   { name: 'ITR', url:['https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Press%20Release']},
  { name: 'Services India', url: ['https://services.india.gov.in/feed/rss?cat_id=10&ln=en'] },
//   { name: 'Tax', url: ['https://tax.cyrilamarchandblogs.com/feed/'] },
  // { name: 'MCA', url: ['https://www.mca.gov.in/Ministry/latestnews/MinistryNews.rss'] }
];
 
function preprocessSEBIPubDate(pubDateString) {
  // Handle the comma in SEBI's date format: "12 Dec, 2024 +0530"
  if (pubDateString.includes(',')) {
    return pubDateString.replace(',', '');
  }
  return pubDateString;
}
 
// Function to fetch and parse RSS feeds
async function fetchRSSFeeds() {
  const feedData = [];
  
  // Create an array of promises for each feed URL
  const feedPromises = rssFeeds.map(feed =>
    Promise.all(
      feed.url.map(url => fetchAndParseRSS(url, feed.name))
    )
  );

  try {
    const results = await Promise.all(feedPromises);

    results.forEach(feedResults => {
      feedResults.forEach(item => {
        if (item && item.length > 0) {
          feedData.push(...item);
        }
      });
    });

  } catch (error) {
    console.error('Error in fetching RSS feeds:', error);
  }

  return feedData.filter(item => {
    const currentTimeUTC = moment.utc();  // Get the current UTC time
      let pubDateString = preprocessSEBIPubDate(item.pubDate);
      const pubDateUTC = moment.utc(pubDateString, "DD MMM YYYY HH:mm:ss Z");
      return pubDateUTC.isAfter(currentTimeUTC.subtract(60, 'minutes'));  // 60 minutes
    }); 
}

 
async function fetchAndParseRSS(url, feedName) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const parsedFeed = await rssParser.parseString(response.data);
      if (!parsedFeed.items || parsedFeed.items.length === 0) {
        console.log(`No items found in feed: ${feedName}`);
        return [];  // Return empty array if no items are found
      }
  
      const feedItems = parsedFeed.items
        .map(item => ({
          source: feedName,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet.slice(0, 800) || ''
        }));
  
      return feedItems;
  
    } catch (error) {
      console.error(`Failed to fetch or parse feed from ${feedName} (${url}):`, error);
      return [];  // Return empty array in case of error
    }
} 

module.exports = fetchRSSFeeds;
