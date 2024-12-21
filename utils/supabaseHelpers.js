const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid'); 

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getAllNotifications = async () => {
  return await supabase.from('NotificationSource').select();
};

const createNotifications = async (notifications) => {
  const transformedList = notifications.map(item =>({
    ...item,
    id: uuidv4(),
    pubDate: new Date(item.pubDate)
  }));
  return await supabase.from('NotificationSource').insert(transformedList);
};

module.exports = { getAllNotifications, createNotifications };
