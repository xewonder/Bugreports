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
        const { data, error } = await supabase
          .from('user_mentions_mgg2024')
          .select('id')
          .limit(1)
          .maybeSingle();
          
        const exists = !error || error.code !== '42P01'; // 42P01 is the PostgreSQL error code for "table does not exist"
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
        const { data, error } = await supabase
          .from('profiles_mgg_2024')
          .select('id, full_name, nickname, role')
          .eq('is_active', true);
          
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
    if (!query || query.trim().length === 0) {
      setMentionSuggestions([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const filtered = users
      .filter(user => {
        // Don't suggest the current user
        if (userProfile && user.id === userProfile.id) return false;
        
        const nickname = user.nickname?.toLowerCase() || '';
        const fullName = user.full_name?.toLowerCase() || '';
        return nickname.includes(lowerQuery) || fullName.includes(lowerQuery);
      })
      .slice(0, 5); // Limit to 5 suggestions
      
    console.log("Mention suggestions for query:", query, filtered);
    setMentionSuggestions(filtered);
    setSelectedIndex(0);
  }, [users, userProfile]);

  const handleMentionInput = useCallback((e, textAreaRef) => {
    if (!textAreaRef || !textAreaRef.current) {
      console.log("No textarea ref available");
      return;
    }
    
    const textarea = textAreaRef.current;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    console.log("Mention input handler called:", {
      text,
      cursorPosition,
      eventType: e.type
    });

    // Find the last @ symbol before cursor
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);
    console.log("Last @ index:", lastAtIndex);
    
    if (lastAtIndex >= 0 && lastAtIndex < cursorPosition) {
      // Get text between @ and cursor
      const textBetween = text.substring(lastAtIndex, cursorPosition);
      const hasSpace = /\s/.test(textBetween.substring(1));
      console.log("Text between @ and cursor:", textBetween, "Has space:", hasSpace);
      
      // If there's no space after @, it's a valid mention query
      if (!hasSpace) {
        const query = textBetween.substring(1); // Remove the @ symbol
        console.log("Valid mention query found:", query);
        setMentionQuery(query);
        searchUsers(query);
        setShowSuggestions(true);
        
        // Calculate position for dropdown
        const rect = textarea.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 20;
        
        // Calculate text before the @ to determine line position
        const textBeforeCursor = text.substring(0, lastAtIndex);
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length - 1; // 0-indexed
        const charPositionInLine = lines[lineNumber].length;
        
        // Better position calculation
        const top = rect.top + ((lineNumber + 1) * lineHeight) + window.scrollY + 10;
        const left = rect.left + Math.min(charPositionInLine * 8, rect.width - 200) + window.scrollX;
        
        setMentionPosition({ top: top, left: left });
        return;
      }
    }
    
    // Hide suggestions if no @ or there's a space
    console.log("Hiding suggestions - no valid @ found");
    setShowSuggestions(false);
  }, [searchUsers]);

  const insertMention = useCallback((user, textAreaRef) => {
    if (!textAreaRef || !textAreaRef.current) return;
    
    const textarea = textAreaRef.current;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    // Find the last @ symbol before cursor
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);
    
    if (lastAtIndex >= 0) {
      // Replace @query with @username
      const beforeMention = text.substring(0, lastAtIndex);
      const afterMention = text.substring(cursorPosition);
      const displayName = user.nickname || user.full_name;
      
      console.log("Inserting mention:", {
        displayName,
        beforeMention,
        afterMention,
        lastAtIndex,
        cursorPosition
      });
      
      const newText = `${beforeMention}@${displayName} ${afterMention}`;
      
      // Update textarea value
      textarea.value = newText;
      
      // Move cursor after the inserted mention
      const newCursorPosition = lastAtIndex + displayName.length + 2; // +2 for @ and space
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      
      // Trigger change event to update React state
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
      
      // Hide suggestions
      setShowSuggestions(false);
    }
  }, []);

  // Store mention data when a mention is made
  const storeMention = async (mentionedUserId, contentType, contentId) => {
    if (!userProfile || !mentionedUserId || userProfile.id === mentionedUserId || !mentionsTableExists) return;
    
    try {
      console.log("Storing mention:", {
        mentionedUserId,
        contentType,
        contentId
      });
      
      // Check if content ID is valid
      if (!contentId) {
        console.error('Invalid contentId for mention:', contentId);
        return;
      }
      
      // Insert the mention
      const { data, error } = await supabase
        .from('user_mentions_mgg2024')
        .insert({
          mentioned_user_id: mentionedUserId,
          mentioned_by_id: userProfile.id,
          content_type: contentType,
          content_id: contentId
        });
        
      if (error) {
        console.error('Error storing mention:', error);
      } else {
        console.log('Mention stored successfully:', data);
      }
    } catch (error) {
      console.error('Error storing mention:', error);
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    if (!text) return [];
    
    // Match @username patterns (improved regex)
    const mentionRegex = /@([a-zA-Z0-9_\-\s]+?)(?=\s|$|[^\w\s\-])/g;
    const mentions = [];
    let match;
    
    console.log("Extracting mentions from text:", text);
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].trim();
      console.log("Found potential mention:", username);
      
      const user = users.find(u => {
        const nickname = (u.nickname || '').toLowerCase();
        const fullName = (u.full_name || '').toLowerCase();
        const usernameLC = username.toLowerCase();
        return nickname === usernameLC || fullName === usernameLC;
      });
      
      if (user) {
        console.log("Matched mention to user:", user);
        mentions.push({
          userId: user.id,
          username: user.nickname || user.full_name,
          index: match.index
        });
      }
    }
    
    return mentions;
  };

  // Process mentions after content is submitted
  const processMentions = (text, contentType, contentId) => {
    if (!text || !mentionsTableExists) return [];
    
    console.log("Processing mentions in text:", text);
    console.log("Content type:", contentType, "Content ID:", contentId);
    
    const mentions = extractMentions(text);
    console.log("Extracted mentions:", mentions);
    
    // Store each mention
    mentions.forEach(mention => {
      storeMention(mention.userId, contentType, contentId);
    });
    
    return mentions;
  };

  // Render function for parsing text with mentions
  const renderWithMentions = (text) => {
    if (!text) return null;
    
    // Use the same regex for consistency
    const mentionRegex = /@([a-zA-Z0-9_\-\s]+?)(?=\s|$|[^\w\s\-])/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Clone the text to avoid modification issues
    const textStr = String(text);
    
    while ((match = mentionRegex.exec(textStr)) !== null) {
      const username = match[1].trim();
      const user = users.find(u => {
        const nickname = (u.nickname || '').toLowerCase();
        const fullName = (u.full_name || '').toLowerCase();
        const usernameLC = username.toLowerCase();
        return nickname === usernameLC || fullName === usernameLC;
      });
      
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(textStr.substring(lastIndex, match.index));
      }
      
      // Add mention
      if (user) {
        parts.push(
          <UserMention
            key={`mention-${match.index}`}
            userId={user.id}
            username={username}
          />
        );
      } else {
        parts.push(`@${username}`);
      }
      
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