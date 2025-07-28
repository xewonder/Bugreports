import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

/**
 * Component to display unread notification count
 * @param {Object} props
 * @param {string} props.contentType - The type of content to filter by (optional)
 * @returns {JSX.Element}
 */
const UserNotificationsCounter = ({ contentType = null }) => {
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile) return;

    const fetchUnreadCount = async () => {
      try {
        // Build the query
        let query = supabase.
        from('user_mentions_mgg2024').
        select('id').
        eq('mentioned_user_id', userProfile.id).
        eq('seen', false);

        // Add content type filter if provided
        if (contentType) {
          if (Array.isArray(contentType)) {
            query = query.in('content_type', contentType);
          } else {
            query = query.eq('content_type', contentType);
          }
        }

        // Execute the query
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching unread mentions:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription
    const subscription = supabase.
    channel('user_mentions_counter').
    on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_mentions_mgg2024',
      filter: `mentioned_user_id=eq.${userProfile.id}`
    },
    () => {
      fetchUnreadCount();
    }
    ).
    subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile, contentType]);

  // Only render if there are unread notifications
  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>);

};

export default UserNotificationsCounter;