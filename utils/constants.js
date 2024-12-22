const scrapeWeb = [
  { name: 'ITR', url: ['https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Press%20Release']},
  { name: 'BSE', url: ['https://www.bseindia.com/investor_relations/announcement.html']},
  { name: 'FSSAI', url: ['https://fssai.gov.in/notifications.php']}
];


const rssFeeds = [
  { name: 'RBI', url: [
    'https://rbi.org.in/pressreleases_rss.xml', 
    'https://rbi.org.in/notifications_rss.xml', 
    'https://rbi.org.in/Publication_rss.xml'
  ]},
  { name: 'SEBI', url: ['https://www.sebi.gov.in/sebirss.xml'] },
  { name: 'NSE', url: [
    'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml',
    'https://nsearchives.nseindia.com/content/RSS/Corporate_Governance.xml',
    'https://nsearchives.nseindia.com/content/RSS/Insider_Trading.xml',
    'https://nsearchives.nseindia.com/content/RSS/Offer_Documents.xml',
    'https://nsearchives.nseindia.com/content/RSS/Sast_Regulation29.xml',
    'https://nsearchives.nseindia.com/content/RSS/Secretarial_Compliance.xml',
    'https://nsearchives.nseindia.com/content/RSS/Sast_Regulation31.xml',
    'https://nsearchives.nseindia.com/content/RSS/Shareholding_Pattern.xml',
    'https://nsearchives.nseindia.com/content/RSS/Circulars.xml'
  ]},
//   { name: 'ITR', url:['https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Press%20Release']},
  { name: 'Services India', url: ['https://services.india.gov.in/feed/rss?cat_id=10&ln=en'] },
//   { name: 'Tax', url: ['https://tax.cyrilamarchandblogs.com/feed/'] },
  // { name: 'MCA', url: ['https://www.mca.gov.in/Ministry/latestnews/MinistryNews.rss'] }
];