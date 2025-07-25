import supabase from './supabase';

export const runSupabaseQuery = async (query) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error('Error running query:', error);
    return { error: error.message, success: false };
  }
};