const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid'); 

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function normalizeDateFormat(inputDate) {
  // Regular Expressions to match various formats
  const dateFormats = [
    // Match format like "03-01-2025" (DD-MM-YYYY)
    /(\d{2})-(\d{2})-(\d{4})/,  // DD-MM-YYYY
    
    // Match format like "13/Jan/2025" (DD/Mon/YYYY)
    /(\d{2})\/([a-zA-Z]{3})\/(\d{4})/,  // DD/Mon/YYYY
    
    // Match formats like "Monday, January 6, 2025"
    /([a-zA-Z]+),\s*([a-zA-Z]+)\s*(\d{1,2}),\s*(\d{4})/,  // Day, Month DD, YYYY
    
    // Match format like "17 December 2024"
    /(\d{1,2})\s([a-zA-Z]+)\s(\d{4})/  // DD Month YYYY
  ];

  // Try parsing using each format
  for (let i = 0; i < dateFormats.length; i++) {
    const match = inputDate.match(dateFormats[i]);
    
    if (match) {
      let parsedDate;
      
      switch (i) {
        case 0:
          // "03-01-2025" -> "01-03-2025" (Reversing DD-MM-YYYY to MM-DD-YYYY format)
          // Manually parse DD-MM-YYYY to MM/DD/YYYY
          parsedDate = new Date(`${match[2]}-${match[1]}-${match[3]}`);  // "MM/DD/YYYY"
          break;
        
        case 1:
          // "13/Jan/2025" -> "Jan 13, 2025"
          parsedDate = new Date(`${match[2]} ${match[1]}, ${match[3]}`);  // "Jan 13, 2025"
          break;
        
        case 2:
          // "Monday, January 6, 2025" -> "January 6, 2025"
          parsedDate = new Date(`${match[2]} ${match[3]}, ${match[4]}`);  // "January 6, 2025"
          break;
        
        case 3:
          // "17 December 2024" -> "December 17, 2024"
          parsedDate = new Date(`${match[2]} ${match[1]}, ${match[3]}`);  // "December 17, 2024"
          break;
        
        default:
          break;
      }
      
      // Ensure the parsed date is valid
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];  // Convert to "YYYY-MM-DD"
      }
    }
  }
  
  // If no matching format is found, throw an error
  throw new Error("Invalid date format");
}

const getDate = (date) => {
  try{
    console.log(normalizeDateFormat(date))
    return new Date(normalizeDateFormat(date)).toISOString()
  } catch(e){
    return new Date().toISOString()
  }
}

const getAllNotifications = async () => {
  return await supabase.from('Notification').select();
};

const createNotifications = async (notifications) => {
  try {
  const transformedList = notifications.map(item =>({
    ...item,
    id: uuidv4(),
    pubDate: getDate(item.pubDate)
  }));

  const { data, error } = await supabase.from('Notification').insert(transformedList);

    // Check if there was an error in the insertion
    if (error) {
      console.error('Error inserting notifications:', error);
      throw new Error(error.message);
    }

    return {data, error: null};

  } catch (err) {
    console.error('Failed to create notifications:', err.message);
    return {error : err};  // Rethrow or handle appropriately
  }
};

const BUCKET_NAME = "snapshots"; 
async function getSnapshot(snapshotPath) {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(`${snapshotPath}.json`);
  if (error) {
    if (error.status === 404) return []; // If file doesn't exist, return an empty array
    throw error;
  }
  return JSON.parse(await data.text());
}

async function saveSnapshot(snapshotPath, snapshotData) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${snapshotPath}.json`, JSON.stringify(snapshotData, null, 2), {
      contentType: "application/json",
      upsert: true, // Overwrites if file already exists
    });

  if (error) {
    console.error("Error uploading snapshot:", error);
  }
}

module.exports = { getAllNotifications, createNotifications, getSnapshot, saveSnapshot };
