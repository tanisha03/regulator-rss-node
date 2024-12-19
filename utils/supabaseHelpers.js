const { createClient } = require('@supabase/supabase-js');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getAllNotifications = async () => {
  return await supabase.from('NotificationSource').select();
};

const createNotifications = async (notifications) => {
  return await supabase.from('NotificationSource').insert(notifications);
};

module.exports = { getAllNotifications, createNotifications };
