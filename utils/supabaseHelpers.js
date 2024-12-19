const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getAllNotifications = async () => {
  return await supabase.from('NotificationSource').select();
};

export const createNotifications = async (notifications) => {
  return await supabase.from('NotificationSource').insert(notifications);
};

module.exports = { getAllNotifications, createNotifications };
