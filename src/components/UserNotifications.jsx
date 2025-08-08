import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiBell, FiX, FiCheckCircle, FiMessageCircle, FiBug, FiStar, FiMap, FiCommand } = FiIcons;

/**
 * Component to display user notifications, particularly mentions
 */
const UserNotifications = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentionsTableExists, setMentionsTableExists] = useState(false);

  // Check if mentions table exists first
  useEffect(() => {
    const checkMentionsTable = async () => {
      try {
        const { data, error } = await supabase.
        from('user_mentions_mgg2024').
        select('id').
        limit(1).
        maybeSingle();

        const exists = !error || error.code !== '42P01';
        console.log('Mentions table exists:', exists);
        setMentionsTableExists(exists);
      } catch (error) {
        console.log('Mentions table may not exist yet:', error);
        setMentionsTableExists(false);
      }
    };

    checkMentionsTable();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!userProfile || !mentionsTableExists) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        console.log("Fetching mentions for user:", userProfile.id);

        const { data, error } = await supabase.
        from('user_mentions_mgg2024').
        select(`
            id,
            seen,
            created_at,
            mentioned_by:mentioned_by_id(id, full_name, nickname),
            content_type,
            content_id
          `).
        eq('mentioned_user_id', userProfile.id).
        order('created_at', { ascending: false }).
        limit(20);

        if (error) throw error;

        console.log("Fetched mentions:", data);

        // Process notifications to add content links
        const processedNotifications = data.map((notification) => {
          let contentLink = '';
          let contentTitle = '';

          switch (notification.content_type) {
            case 'bug':
              contentLink = `/bugs/${notification.content_id}`;
              contentTitle = 'a bug report';
              break;
            case 'bug_comment':
              contentLink = `/bugs/${notification.content_id}`;
              contentTitle = 'a bug comment';
              break;
            case 'feature':
              contentLink = `/features`;
              contentTitle = 'a feature request';
              break;
            case 'feature_comment':
              contentLink = `/features`;
              contentTitle = 'a feature comment';
              break;
            case 'general_topic':
              contentLink = `/general-talk`;
              contentTitle = 'a discussion topic';
              break;
            case 'general_topic_comment':
              contentLink = `/general-talk`;
              contentTitle = 'a discussion comment';
              break;
            case 'power_prompt':
              contentLink = `/prompts`;
              contentTitle = 'a power prompt';
              break;
            case 'power_prompt_comment':
              contentLink = `/prompts`;
              contentTitle = 'a power prompt comment';
              break;
              case 'roadmap':
              contentLink = `/roadmap`;
             contentTitle = 'a roadmap item';
             break;
            case 'roadmap_comment':
              contentLink = `/roadmap`;
              contentTitle = 'a roadmap comment';
              break;
            case 'tip':
              contentLink = `/tips`;
              contentTitle = 'a tip or trick';
              break;
            case 'tip_comment':
              contentLink = `/tips`;
              contentTitle = 'a tip comment';
              break;
              
            default:
              contentLink = '/';
              contentTitle = 'content';
          }

          return { ...notification, contentLink, contentTitle };
        });

        setNotifications(processedNotifications);
        setUnreadCount(processedNotifications.filter((n) => !n.seen).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription only if table exists
    if (mentionsTableExists) {
      const subscription = supabase.
      channel('user_mentions').
      on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_mentions_mgg2024',
        filter: `mentioned_user_id=eq.${userProfile.id}`
      },
      (payload) => {
        // Add new notification
        fetchNotifications();
      }
      ).
      subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userProfile, mentionsTableExists]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!mentionsTableExists) return;

    try {
      const { error } = await supabase.
      from('user_mentions_mgg2024').
      update({ seen: true }).
      eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, seen: true } : notification
      ));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications.length === 0 || !mentionsTableExists) return;

    try {
      const { error } = await supabase.
      from('user_mentions_mgg2024').
      update({ seen: true }).
      eq('mentioned_user_id', userProfile.id).
      eq('seen', false);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map((notification) => ({ ...notification, seen: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get icon for content type
  const getContentIcon = (contentType) => {
    if (contentType.includes('bug')) return FiBug;
    if (contentType.includes('feature')) return FiStar;
    if (contentType.includes('roadmap')) return FiMap;
    if (contentType.includes('power_prompt')) return FiCommand;
    return FiMessageCircle;
  };

  // Get display name with fallback
  const getDisplayName = (user) => {
    if (!user) return 'Someone';
    return user.nickname || user.full_name || 'Someone';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">

        <SafeIcon icon={FiBell} className="text-xl" />
        {unreadCount > 0 &&
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        }
      </button>

      <AnimatePresence>
        {showNotifications &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[999]"
          style={{ 
            maxHeight: 'calc(100vh - 100px)',
            top: '60px'
          }}>

            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 &&
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800">

                  Mark all as read
                </button>
            }
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {loading ?
            <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                </div> :
            !mentionsTableExists ?
            <div className="p-4 text-center">
                  <SafeIcon icon={FiBell} className="text-gray-400 text-2xl mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Notifications will appear here</p>
                </div> :
            notifications.length > 0 ?
            notifications.map((notification) => {
              const mentionerName = getDisplayName(notification.mentioned_by);

              return (
                <Link
                  key={notification.id}
                  to={notification.contentLink}
                  className={`block p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${!notification.seen ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notification.id)}>

                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.seen ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <SafeIcon
                        icon={getContentIcon(notification.content_type)}
                        className={!notification.seen ? 'text-blue-600' : 'text-gray-600'} />

                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{mentionerName}</span> mentioned you in {notification.contentTitle}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        {!notification.seen &&
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    }
                      </div>
                    </Link>);

            }) :

            <div className="p-4 text-center">
                  <SafeIcon icon={FiBell} className="text-gray-400 text-2xl mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
            }
            </div>
            
            <div className="p-3 border-t border-gray-200 flex justify-center">
              <button
              onClick={() => setShowNotifications(false)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1">

                <SafeIcon icon={FiX} className="text-sm" />
                <span>Close</span>
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default UserNotifications;
