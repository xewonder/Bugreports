import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import UserMention from '../components/UserMention';
import supabase from '../lib/supabase';

const MentionContext = createContext();

export function MentionProvider({ children }) {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionsTableExists, setMentionsTableExists] = useState(true);
  const [currentMentionStartIndex, setCurrentMentionStartIndex] = useState(-1);

  // Fetch all users for mention suggestions from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching users for mentions from Supabase...');

        // Fetch all active users from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles_mgg_2024')
          .select('id, full_name, nickname, role, is_active')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setUsers([]);
          return;
        }

        console.log('✅ Fetched users for mentions:', profilesData?.length || 0, 'users');

        // Transform the data to match expected format
        const transformedUsers = (profilesData || []).map((profile) => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown User',
          nickname: profile.nickname || profile.full_name || 'User',
          role: profile.role || 'user'
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users for mentions:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const searchUsers = useCallback((query) => {
    if (!query || query.trim().length === 0) {
      setMentionSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = users
      .filter((user) => {
        // Don't suggest the current user
        if (userProfile && user.id === userProfile.id) return false;

        const nickname = user.nickname?.toLowerCase() || '';
        const fullName = user.full_name?.toLowerCase() || '';
        return nickname.includes(lowerQuery) || fullName.includes(lowerQuery);
      })
      .slice(0, 5); // Limit to 5 suggestions

    setMentionSuggestions(filtered);
    setSelectedIndex(0);
  }, [users, userProfile]);

  const handleMentionInput = useCallback((e, textAreaRef) => {
    if (!textAreaRef || !textAreaRef.current) {
      return;
    }

    const textarea = textAreaRef.current;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;

    // Find the last @ symbol before cursor
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);

    if (lastAtIndex >= 0 && lastAtIndex < cursorPosition) {
      // Check if @ is at the beginning or has a space/newline before it
      const isValidMentionStart = lastAtIndex === 0 || /[\s\n]/.test(text[lastAtIndex - 1]);
      
      // Get text between @ and cursor
      const textBetween = text.substring(lastAtIndex, cursorPosition);
      const hasSpaceOrNewline = /[\s\n]/.test(textBetween.substring(1));

      // If it's a valid mention start and there's no space/newline after @
      if (isValidMentionStart && !hasSpaceOrNewline) {
        const query = textBetween.substring(1); // Remove the @ symbol
        setMentionQuery(query);
        setCurrentMentionStartIndex(lastAtIndex);
        searchUsers(query);

        // Calculate position for dropdown with better accuracy
        const rect = textarea.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const fontSize = parseFloat(computedStyle.fontSize) || 14;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

        // Calculate approximate character width (monospace estimation)
        const charWidth = fontSize * 0.6;

        // Split text before cursor to calculate line and position
        const textBeforeCursor = text.substring(0, lastAtIndex);
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length - 1;
        const charPositionInLine = lines[lineNumber]?.length || 0;

        // Calculate position
        const top = rect.top + paddingTop + (lineNumber + 1) * lineHeight + window.scrollY + 5;
        const left = Math.min(
          rect.left + paddingLeft + charPositionInLine * charWidth + window.scrollX,
          window.innerWidth - 280 // Ensure dropdown doesn't go off-screen
        );

        setMentionPosition({ top, left });
        setShowSuggestions(true);
        return;
      }
    }

    // Hide suggestions if no @ or there's a space/newline
    setShowSuggestions(false);
  }, [searchUsers]);

  // Extract mentions from text
  const extractMentions = (text) => {
    if (!text) return [];

    console.log('🔍 Extracting mentions from text:', text);

    // Match @[username](userId) patterns
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].trim();
      const userId = match[2];

      mentions.push({
        userId: userId,
        username: username,
        index: match.index
      });
    }

    console.log('🔍 Found mentions:', mentions);
    return mentions;
  };

  // Store mention data when a mention is made
  const storeMention = async (mentionedUserId, contentType, contentId) => {
    if (!userProfile || !mentionedUserId || userProfile.id === mentionedUserId) {
      console.log('⏭️ Skipping mention storage:', {
        hasUserProfile: !!userProfile,
        mentionedUserId,
        isSelf: userProfile?.id === mentionedUserId
      });
      return;
    }

    try {
      console.log('💾 Storing mention:', {
        mentionedUserId,
        mentionedBy: userProfile.id,
        contentType,
        contentId
      });

      // Check if content ID is valid
      if (!contentId) {
        console.error('❌ Invalid contentId for mention:', contentId);
        return;
      }

      // Insert the mention into Supabase
      const { data, error } = await supabase
        .from('user_mentions_mgg2024')
        .insert({
          mentioned_user_id: mentionedUserId,
          mentioned_by_id: userProfile.id,
          content_type: contentType,
          content_id: contentId
        })
        .select();

      if (error) {
        console.error('❌ Error storing mention:', error);
        throw error;
      }

      console.log('✅ Mention stored successfully:', data);
    } catch (error) {
      console.error('❌ Error storing mention:', error);
    }
  };

  // Process mentions after content is submitted
  const processMentions = (text, contentType, contentId) => {
    console.log('🔄 Processing mentions:', {
      text: text?.substring(0, 100) + (text?.length > 100 ? '...' : ''),
      contentType,
      contentId,
      hasUserProfile: !!userProfile
    });

    if (!text) {
      console.log('⏭️ No text provided for mention processing');
      return [];
    }

    if (!userProfile) {
      console.log('⏭️ No user profile available for mention processing');
      return [];
    }

    const mentions = extractMentions(text);

    if (mentions.length === 0) {
      console.log('⏭️ No mentions found in text');
      return [];
    }

    // Store each mention
    mentions.forEach((mention) => {
      console.log('📝 Processing mention:', mention);
      storeMention(mention.userId, contentType, contentId);
    });

    console.log(`✅ Processed ${mentions.length} mentions`);
    return mentions;
  };

  // Render function for parsing text with mentions
  const renderWithMentions = (text) => {
    if (!text) return null;

    // Use regex to match @[username](userId) format
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Clone the text to avoid modification issues
    const textStr = String(text);

    while ((match = mentionRegex.exec(textStr)) !== null) {
      const username = match[1].trim();
      const userId = match[2];

      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(textStr.substring(lastIndex, match.index));
      }

      // Add mention component
      parts.push(
        <UserMention
          key={`mention-${match.index}`}
          userId={userId}
          username={username}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < textStr.length) {
      parts.push(textStr.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const value = {
    users,
    loading,
    mentionSuggestions,
    showSuggestions,
    mentionPosition,
    selectedIndex,
    setSelectedIndex,
    handleMentionInput,
    processMentions,
    renderWithMentions,
    setShowSuggestions,
    mentionsTableExists,
    currentMentionStartIndex,
    setCurrentMentionStartIndex
  };

  return (
    <MentionContext.Provider value={value}>
      {children}
    </MentionContext.Provider>
  );
}

export function useMention() {
  return useContext(MentionContext);
}