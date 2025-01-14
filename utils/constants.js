const scrapeWeb = [
  {
    name: 'ITR',
    url: 'https://incometaxindia.gov.in/_layouts/15/Dit/Pages/Rss.aspx?List=Press%20Release',
    selectors: {
      articleSelector: '.itemdiv',
      linkSelector: '.mainlink',
      nameSelector: '.mainlink',
      dateSelector: 'div-n-2',
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
      dateSelector: 'div-n-2',
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
  // {
  //   name: 'FSSAI',
  //   url: 'https://fssai.gov.in/advisories.php',
  //   selectors: {
  //     articleSelector: 'tr',
  //     linkSelector: 'a',
  //     nameSelector: 'td-n-2',
  //     dateSelector: 'td-n-3',
  //     contentSelector: null
  //   }
  // },
  {
    name: 'Directorate of Enforcement',
    url: 'https://enforcementdirectorate.gov.in/press-release',
    selectors: {
      articleSelector: 'tr',
      linkSelector: 'a',
      nameSelector: '.views-field-field-press-release-title',
      dateSelector: '.views-field-field-date-of-release',
      contentSelector: null
    }
  },
  {
    name: 'Central Board Of Indirect Taxes & Customs',
    url: 'https://www.cbic.gov.in/entities/whatsNew',
    selectors: {
      articleSelector: '.card',
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
      nameSelector: 'p',
      dateSelector: '.date-time-stamp',
      contentSelector: null
    }
  },
  {
    name: 'CBDT',
    url: 'https://incometaxindia.gov.in/Pages/press-releases.aspx',
    selectors: {
      articleSelector: '.news-rows',
      linkSelector: 'a',
      nameSelector: 'a',
      dateSelector: 'span',
      contentSelector: null
    }
  },
];

const rssFeeds = [
  { name: 'RBI', url: [
    // 'https://rbi.org.in/pressreleases_rss.xml', 
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
  // { name: 'Services India', url: ['https://services.india.gov.in/feed/rss?cat_id=10&ln=en'] },
//   { name: 'Tax', url: ['https://tax.cyrilamarchandblogs.com/feed/'] },
  // { name: 'MCA', url: ['https://www.mca.gov.in/Ministry/latestnews/MinistryNews.rss'] }
];

module.exports = { scrapeWeb, rssFeeds };
