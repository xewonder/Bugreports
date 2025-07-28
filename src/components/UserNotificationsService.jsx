import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

/**
 * Service component that handles email notifications for user mentions
 * This component doesn't render anything but handles the notification logic
 */
const UserNotificationsService = () => {
  const { userProfile } = useAuth();

  // Function to send email notification for new mentions
  const sendEmailNotification = async (mention) => {
    try {
      // Get information about the mentioned user
      const { data: mentionedUser, error: userError } = await supabase.
      from('profiles_mgg_2024').
      select('email, full_name, nickname').
      eq('id', mention.mentioned_user_id).
      single();

      if (userError || !mentionedUser) {
        console.error('Error fetching mentioned user:', userError);
        return;
      }

      // Get information about the user who mentioned
      const { data: mentionerUser, error: mentionerError } = await supabase.
      from('profiles_mgg_2024').
      select('full_name, nickname').
      eq('id', mention.mentioned_by_id).
      single();

      if (mentionerError || !mentionerUser) {
        console.error('Error fetching mentioner user:', mentionerError);
        return;
      }

      // Get content details based on content type
      const contentTypeMap = {
        bug: { table: 'bugs_mgg2024', nameField: 'title' },
        bug_comment: { table: 'bugs_mgg2024', nameField: 'title', isComment: true },
        feature: { table: 'feature_requests_mgg2024', nameField: 'title' },
        feature_comment: { table: 'feature_requests_mgg2024', nameField: 'title', isComment: true },
        roadmap: { table: 'roadmap_items_mgg2024', nameField: 'title' },
        roadmap_comment: { table: 'roadmap_items_mgg2024', nameField: 'title', isComment: true },
        power_prompt: { table: 'power_prompts_mgg2024', nameField: 'title' },
        power_prompt_comment: { table: 'power_prompts_mgg2024', nameField: 'title', isComment: true },
        general_topic: { table: 'general_topics_mgg2024', nameField: 'title' },
        general_topic_comment: { table: 'general_topics_mgg2024', nameField: 'title', isComment: true },
        tip: { table: 'tips_and_tricks_mgg2024', nameField: 'title' },
        tip_comment: { table: 'tips_and_tricks_mgg2024', nameField: 'title', isComment: true }
      };

      // Skip if content type not recognized
      const contentTypeInfo = contentTypeMap[mention.content_type];
      if (!contentTypeInfo) {
        console.error('Unknown content type:', mention.content_type);
        return;
      }

      // Get the content title
      const { data: contentData, error: contentError } = await supabase.
      from(contentTypeInfo.table).
      select(contentTypeInfo.nameField).
      eq('id', contentTypeInfo.isComment ? mention.content_id.split('_')[0] : mention.content_id).
      single();

      if (contentError) {
        console.error('Error fetching content details:', contentError);
        return;
      }

      // Construct email content
      const mentionerName = mentionerUser.nickname || mentionerUser.full_name || 'Someone';
      const contentName = contentData ? contentData[contentTypeInfo.nameField] : 'a post';
      const contentTypeName = mention.content_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      // Get the appropriate URL for the mention
      const getContentUrl = () => {
        const baseUrl = window.location.origin;
        const contentType = mention.content_type.split('_')[0];

        switch (contentType) {
          case 'bug':
            return `${baseUrl}/#/bugs/${mention.content_id}`;
          case 'feature':
            return `${baseUrl}/#/features`;
          case 'roadmap':
            return `${baseUrl}/#/roadmap`;
          case 'power_prompt':
            return `${baseUrl}/#/prompts`;
          case 'general_topic':
            return `${baseUrl}/#/general-talk`;
          case 'tip':
            return `${baseUrl}/#/tips`;
          default:
            return `${baseUrl}/#/`;
        }
      };

      // Construct the email payload
      const emailPayload = {
        to: mentionedUser.email,
        subject: `MGG™ Notification: You were mentioned by ${mentionerName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">You've been mentioned in MGG™</h2>
            <p><strong>${mentionerName}</strong> mentioned you in ${contentTypeName}: "${contentName}"</p>
            <p>Click the button below to view:</p>
            <a href="${getContentUrl()}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Mention</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated notification from MGG™ Software Package. You're receiving this because you have email notifications enabled.
            </p>
          </div>
        `
      };

      // Call the serverless function to send the email
      // Note: In a production environment, you would typically have a serverless function
      // that handles the actual sending of emails using services like SendGrid, AWS SES, etc.
      // For this example, we'll use Supabase's edge functions to handle email sending
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: emailPayload
      });

      if (emailError) {
        console.error('Error sending notification email:', emailError);
      } else {
        console.log('Email notification sent successfully');
      }

    } catch (error) {
      console.error('Error in sendEmailNotification:', error);
    }
  };

  // Listen for new mentions and send email notifications
  useEffect(() => {
    if (!userProfile) return;

    // Set up real-time subscription for mentions
    const subscription = supabase.
    channel('user_mentions_emails').
    on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'user_mentions_mgg2024'
    },
    async (payload) => {
      // Check if the user has email notifications enabled
      const { data: userSettings } = await supabase.
      from('profiles_mgg_2024').
      select('email, notifications').
      eq('id', payload.new.mentioned_user_id).
      single();

      // If user has email notifications enabled, send the email
      if (userSettings?.notifications?.email === true) {
        await sendEmailNotification(payload.new);
      }
    }
    ).
    subscribe();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile]);

  // This component doesn't render anything
  return null;
};

export default UserNotificationsService;