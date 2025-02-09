const axios = require('axios');
const RSSParser = require('rss-parser');
const moment = require('moment'); 
const { rssFeeds } = require('../utils/constants');

const rssParser = new RSSParser();

const getDate = (date) => {
  try{
    console.log(normalizeDateFormat(date))
    return new Date(normalizeDateFormat(date)).toISOString()
  } catch(e){
    return new Date().toISOString()
  }
}
 
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


  const { getSnapshot, saveSnapshot } = require('../utils/supabaseHelpers');
  const res = await getSnapshot('rssFeed');
  const existingTitles = res.map(item => item.title); // Extract titles from rssFeed

  console.log('~~~~~ cuurr', res.length);
  const filteredFeedData = feedData.filter(item => !existingTitles.includes(item.title)); 
  const finalList = [...filteredFeedData, ...res];
  console.log('~~~~~ now', filteredFeedData.length, finalList.length);
  saveSnapshot('rssFeed', finalList);
  return filteredFeedData;
}

 
async function fetchAndParseRSS(url, feedName) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
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
          pubDate: getDate(item.pubDate),
          contentSnippet: item.contentSnippet.slice(0, 800) || '',
          // createdAt: new Date().getTime()
        }));
  
      return feedItems;
  
    } catch (error) {
      console.error(`Failed to fetch or parse feed from ${feedName} (${url}):`, error);
      return [];  // Return empty array in case of error
    }
} 

module.exports = { fetchRSSFeeds };
