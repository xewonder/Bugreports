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
  const [mentionsTableExists, setMentionsTableExists] = useState(false);

  // Check if mentions table exists
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

  // Fetch all users for mention suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.
        from('profiles_mgg_2024').
        select('id,full_name,nickname,role').
        eq('is_active', true);
        if (error) throw error;
        console.log("Fetched users for mentions:", data?.length || 0, "users");
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users for mentions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const searchUsers = useCallback((query) => {
    console.log("🔍 Searching users with query:", query);
    if (!query || query.trim().length === 0) {
      console.log("Empty query, clearing suggestions");
      setMentionSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = users.
    filter((user) => {
      // Don't suggest the current user
      if (userProfile && user.id === userProfile.id) return false;
      const nickname = user.nickname?.toLowerCase() || '';
      const fullName = user.full_name?.toLowerCase() || '';
      return nickname.includes(lowerQuery) || fullName.includes(lowerQuery);
    }).
    slice(0, 5); // Limit to 5 suggestions

    console.log("🎯 Found filtered users:", filtered);
    setMentionSuggestions(filtered);
    setSelectedIndex(0);
  }, [users, userProfile]);

  const handleMentionInput = useCallback((e, textAreaRef) => {
    if (!textAreaRef || !textAreaRef.current) {
      console.log("❌ No textarea ref available");
      return;
    }

    const textarea = textAreaRef.current;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    console.log("⌨️ Mention input handler called:", { text, cursorPosition, eventType: e.type, textLength: text.length });

    // Find the last @ symbol before cursor
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);
    console.log("📍 Last @ index:", lastAtIndex);

    if (lastAtIndex >= 0 && lastAtIndex < cursorPosition) {
      // Get text between @ and cursor
      const textBetween = text.substring(lastAtIndex, cursorPosition);
      const hasSpaceOrNewline = /[\s\n]/.test(textBetween.substring(1));
      console.log("📝 Text between @ and cursor:", textBetween, "Has space/newline:", hasSpaceOrNewline);

      // If there's no space/newline after @, it's a valid mention query
      if (!hasSpaceOrNewline) {
        const query = textBetween.substring(1); // Remove the @ symbol
        console.log("✅ Valid mention query found:", query);
        setMentionQuery(query);
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

        console.log("📍 Setting mention position:", { 
          top, 
          left, 
          rect, 
          lineNumber, 
          charPositionInLine,
          lineHeight,
          fontSize,
          charWidth
        });
        
        setMentionPosition({ top, left });
        setShowSuggestions(true);
        return;
      }
    }

    // Hide suggestions if no @ or there's a space/newline
    console.log("❌ Hiding suggestions - no valid @ found");
    setShowSuggestions(false);
  }, [searchUsers]);

  const insertMention = useCallback((user, textAreaRef) => {
    console.log("🎯 Inserting mention for user:", user);
    if (!textAreaRef || !textAreaRef.current) return;

    const textarea = textAreaRef.current;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;

    // Find the last @ symbol before cursor
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);

    if (lastAtIndex >= 0) {
      // Replace @query with @[username](userId)
      const beforeMention = text.substring(0, lastAtIndex);
      const afterMention = text.substring(cursorPosition);
      const displayName = user.nickname || user.full_name;

      // Use the format @[username](userId) for better parsing
      const mentionText = `@[${displayName}](${user.id})`;
      const newText = `${beforeMention}${mentionText}${afterMention}`;

      console.log("✏️ Inserting mention:", { 
        displayName, 
        beforeMention, 
        afterMention, 
        lastAtIndex, 
        cursorPosition, 
        mentionText,
        newText 
      });

      // Update textarea value
      textarea.value = newText;

      // Move cursor after the inserted mention
      const newCursorPosition = lastAtIndex + mentionText.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);

      // Trigger change event to update React state
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);

      // Focus back on textarea
      textarea.focus();

      // Hide suggestions
      setShowSuggestions(false);
    }
  }, []);

  // Store mention data when a mention is made
  const storeMention = async (mentionedUserId, contentType, contentId) => {
    if (!userProfile || !mentionedUserId || userProfile.id === mentionedUserId || !mentionsTableExists) return;

    try {
      console.log("💾 Storing mention:", { mentionedUserId, contentType, contentId });

      // Check if content ID is valid
      if (!contentId) {
        console.error('Invalid contentId for mention:', contentId);
        return;
      }

      // Insert the mention
      const { data, error } = await supabase.
      from('user_mentions_mgg2024').
      insert({
        mentioned_user_id: mentionedUserId,
        mentioned_by_id: userProfile.id,
        content_type: contentType,
        content_id: contentId
      });

      if (error) {
        console.error('Error storing mention:', error);
      } else {
        console.log('✅ Mention stored successfully:', data);
      }
    } catch (error) {
      console.error('Error storing mention:', error);
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    if (!text) return [];

    // Match @[username](userId) patterns
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;

    console.log("🔍 Extracting mentions from text:", text);

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].trim();
      const userId = match[2];
      console.log("👤 Found mention:", username, userId);
      mentions.push({
        userId: userId,
        username: username,
        index: match.index
      });
    }

    return mentions;
  };

  // Process mentions after content is submitted
  const processMentions = (text, contentType, contentId) => {
    if (!text || !mentionsTableExists) return [];

    console.log("⚙️ Processing mentions in text:", text);
    console.log("📋 Content type:", contentType, "Content ID:", contentId);

    const mentions = extractMentions(text);
    console.log("📝 Extracted mentions:", mentions);

    // Store each mention
    mentions.forEach((mention) => {
      storeMention(mention.userId, contentType, contentId);
    });

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
          username={username} />
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
    insertMention,
    processMentions,
    renderWithMentions,
    setShowSuggestions,
    mentionsTableExists
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