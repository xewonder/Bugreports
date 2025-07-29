import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import UserMention from '../components/UserMention';

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
  const [mentionsTableExists, setMentionsTableExists] = useState(true); // Always true for EasySite DB

  // Fetch all users for mention suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching users for mentions...');

        // First, get the current user info to populate profiles if needed
        const { data: currentUser, error: userError } = await window.ezsite.apis.getUserInfo();

        // Fetch profiles from the database
        const { data: profilesData, error: profilesError } = await window.ezsite.apis.tablePage(31708, {
          "PageNo": 1,
          "PageSize": 100,
          "OrderByField": "ID",
          "IsAsc": true,
          "Filters": [
          {
            "name": "is_active",
            "op": "Equal",
            "value": true
          }]

        });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);

          // If no profiles exist and we have a current user, create a profile
          if (currentUser && !userError) {
            console.log('📝 Creating profile for current user...');
            await window.ezsite.apis.tableCreate(31708, {
              "user_id": currentUser.ID || currentUser.id,
              "full_name": currentUser.Name || currentUser.Email,
              "nickname": currentUser.Name || currentUser.Email.split('@')[0],
              "role": "user",
              "is_active": true
            });

            // Set the current user as the only available user
            setUsers([{
              id: currentUser.ID || currentUser.id,
              full_name: currentUser.Name || currentUser.Email,
              nickname: currentUser.Name || currentUser.Email.split('@')[0],
              role: "user"
            }]);
          }
        } else {
          console.log('✅ Fetched users for mentions:', profilesData?.List?.length || 0, 'users');

          // Transform the data to match expected format
          const transformedUsers = (profilesData?.List || []).map((profile) => ({
            id: profile.user_id,
            full_name: profile.full_name,
            nickname: profile.nickname,
            role: profile.role
          }));

          // If no users exist, create sample users for testing
          if (transformedUsers.length === 0) {
            console.log('📝 No users found, creating sample users...');
            const sampleUsers = [
            {
              user_id: "user-1",
              full_name: "John Doe",
              nickname: "john",
              role: "admin",
              is_active: true
            },
            {
              user_id: "user-2",
              full_name: "Jane Smith",
              nickname: "jane",
              role: "developer",
              is_active: true
            },
            {
              user_id: "user-3",
              full_name: "Bob Wilson",
              nickname: "bob",
              role: "user",
              is_active: true
            },
            {
              user_id: "user-4",
              full_name: "Alice Johnson",
              nickname: "alice",
              role: "user",
              is_active: true
            }];


            // Create sample users
            for (const user of sampleUsers) {
              try {
                await window.ezsite.apis.tableCreate(31708, user);
                console.log('✅ Created sample user:', user.nickname);
              } catch (err) {
                console.log('Sample user might exist:', user.nickname);
              }
            }

            // Set the sample users in state
            setUsers(sampleUsers.map((user) => ({
              id: user.user_id,
              full_name: user.full_name,
              nickname: user.nickname,
              role: user.role
            })));
          } else {
            setUsers(transformedUsers);
          }

          // If current user exists but not in profiles, add them
          if (currentUser && !userError) {
            const userId = currentUser.ID || currentUser.id;
            const userExists = transformedUsers.some((user) => user.id === userId);
            if (!userExists) {
              console.log('📝 Adding current user to profiles...');
              await window.ezsite.apis.tableCreate(31708, {
                "user_id": userId,
                "full_name": currentUser.Name || currentUser.Email,
                "nickname": currentUser.Name || currentUser.Email.split('@')[0],
                "role": "user",
                "is_active": true
              });

              // Add to the local state
              const newUser = {
                id: userId,
                full_name: currentUser.Name || currentUser.Email,
                nickname: currentUser.Name || currentUser.Email.split('@')[0],
                role: "user"
              };
              setUsers((prev) => [...prev, newUser]);
            }
          }
        }
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
      if (userProfile && user.id === (userProfile.ID || userProfile.id)) return false;
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

  const insertMention = useCallback((user, textAreaRef, onValueChange = null) => {
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

      // Update textarea value first
      textarea.value = newText;

      // Move cursor after the inserted mention
      const newCursorPosition = lastAtIndex + mentionText.length;
      
      // If we have a callback to update React state, use it
      if (onValueChange && typeof onValueChange === 'function') {
        onValueChange(newText);
        // Set cursor position after state update
        setTimeout(() => {
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }, 0);
      } else {
        // Fallback to event dispatching
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // Create and dispatch a proper change event
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          value: textarea,
          enumerable: true,
          writable: false
        });
        Object.defineProperty(event, 'currentTarget', {
          value: textarea,
          enumerable: true,
          writable: false
        });
        
        textarea.dispatchEvent(event);
        textarea.focus();
      }

      // Hide suggestions
      setShowSuggestions(false);
    }
  }, []);

  // Store mention data when a mention is made
  const storeMention = async (mentionedUserId, contentType, contentId) => {
    if (!userProfile || !mentionedUserId || (userProfile.ID || userProfile.id) === mentionedUserId) return;

    try {
      console.log("💾 Storing mention:", { mentionedUserId, contentType, contentId });

      // Check if content ID is valid
      if (!contentId) {
        console.error('Invalid contentId for mention:', contentId);
        return;
      }

      // Insert the mention
      const { error } = await window.ezsite.apis.tableCreate(31709, {
        "mentioned_user_id": mentionedUserId,
        "mentioned_by_id": userProfile.ID || userProfile.id,
        "content_type": contentType,
        "content_id": contentId
      });

      if (error) {
        console.error('Error storing mention:', error);
      } else {
        console.log('✅ Mention stored successfully');
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
    if (!text) return [];

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

  // Create an enhanced insertMention that can accept a value change callback
  const enhancedInsertMention = useCallback((user, textAreaRef, valueChangeCallback) => {
    return insertMention(user, textAreaRef, valueChangeCallback);
  }, [insertMention]);

  const value = {
    users,
    loading,
    mentionSuggestions,
    showSuggestions,
    mentionPosition,
    selectedIndex,
    setSelectedIndex,
    handleMentionInput,
    insertMention: enhancedInsertMention,
    processMentions,
    renderWithMentions,
    setShowSuggestions,
    mentionsTableExists
  };

  return (
    <MentionContext.Provider value={value}>
      {children}
    </MentionContext.Provider>);

}

export function useMention() {
  return useContext(MentionContext);
}