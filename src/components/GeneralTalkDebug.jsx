import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase';

const GeneralTalkDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // Check if tables exist
      const { data: topics, error: topicsError } = await supabase.
      from('general_topics_mgg2024').
      select('count').
      limit(1);

      const { data: comments, error: commentsError } = await supabase.
      from('general_topic_comments_mgg2024').
      select('count').
      limit(1);

      const { data: votes, error: votesError } = await supabase.
      from('general_topic_votes_mgg2024').
      select('count').
      limit(1);

      setDebugInfo({
        topicsTable: topicsError ? `Error: ${topicsError.message}` : 'OK',
        commentsTable: commentsError ? `Error: ${commentsError.message}` : 'OK',
        votesTable: votesError ? `Error: ${votesError.message}` : 'OK',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not set',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">General Talk Debug Information</h2>
      <div className="space-y-2">
        {Object.entries(debugInfo).map(([key, value]) =>
        <div key={key} className="flex justify-between">
            <span className="font-medium">{key}:</span>
            <span className={value.includes('Error') ? 'text-red-600' : 'text-green-600'}>
              {value}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={checkDatabase}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">

        Refresh Check
      </button>
    </div>);

};

export default GeneralTalkDebug;