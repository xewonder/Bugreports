import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * MentionContext
 * - Looser @-trigger: allow start-of-line or any non-word char before '@'
 * - Fallback on submit: resolve plain @handles to users if user didn't pick from dropdown
 *
 * Exposed API (keep same names your app already uses):
 *   - getMentionTriggerAt(text, caretPos) -> { start, query } | null
 *   - processMentions(text, contentType, contentId) -> stores rows in user_mentions_mgg2024
 *
 * NOTE: We don't mutate caller text here; normalization is handled by the page (see GeneralTalk.jsx patch).
 */

const MentionContext = createContext(null);
export const useMentionContext = () => useContext(MentionContext);

export default function MentionProvider({ children, users = [] }) {
  /**
   * Return current @-trigger if caret is inside an @word that started at a valid position.
   */
  const getMentionTriggerAt = (text, caretPos) => {
    if (!text || typeof caretPos !== 'number') return null;

    const lastAtIndex = text.lastIndexOf('@', Math.max(0, caretPos - 1));
    if (lastAtIndex === -1) return null;

    // NEW: allow start-of-line OR any non-word char before '@'
    const before = text[lastAtIndex - 1] || '';
    const isValidMentionStart = lastAtIndex === 0 || /[^\w@]/.test(before);
    if (!isValidMentionStart) return null;

    const slice = text.slice(lastAtIndex + 1, caretPos);
    // stop if whitespace/newline before caret
    if (/\s/.test(slice)) return null;

    return { start: lastAtIndex, query: slice };
  };

  /**
   * Helper to resolve a plain @handle to a user record (nickname preferred, else full_name)
   */
  const resolveHandle = (handle) => {
    if (!handle) return null;
    const h = handle.toLowerCase();
    return (
      users.find(
        (u) =>
          (u.nickname && u.nickname.toLowerCase() === h) ||
          (u.full_name &&
            u.full_name.toLowerCase().replace(/\s+/g, '') === h)
      ) || null
    );
  };

  /**
   * Scan text for canonical mentions @[Display](id).
   */
  const extractCanonicalMentions = (text) => {
    const tokenRegex = /\@\[(.+?)\]\(([a-f0-9-]{16,})\)/gi; // id may be UUID or similar
    const out = [];
    let m;
    while ((m = tokenRegex.exec(text)) !== null) {
      out.push({
        display: m[1],
        userId: m[2],
        index: m.index,
      });
    }
    return out;
  };

  /**
   * Fallback: find plain @handles and resolve against loaded users.
   */
  const extractPlainHandleMentions = (text) => {
    const plainHandleRegex = /@([A-Za-z0-9._-]{2,})/g;
    const out = [];
    const seen = new Set();
    let m;
    while ((m = plainHandleRegex.exec(text)) !== null) {
      const handle = m[1];
      if (seen.has(handle)) continue;
      const u = resolveHandle(handle);
      if (u) {
        out.push({
          display: u.nickname || u.full_name || handle,
          userId: u.id,
          index: m.index,
        });
        seen.add(handle);
      }
    }
    return out;
  };

  /**
   * Store mentions for a given content (type/id). Called after saving the content.
   * - First, use canonical tokens @[Display](id)
   * - If none, fallback to plain @handles
   */
  const processMentions = async (rawText, contentType, contentId) => {
    const text = rawText || '';
    let mentions = extractCanonicalMentions(text);

    if (mentions.length === 0) {
      mentions = extractPlainHandleMentions(text);
    }
    if (mentions.length === 0) return;

    const rows = mentions.map((m) => ({
      mentioned_user_id: m.userId,
      content_type: contentType,
      content_id: contentId,
    }));

    const { error } = await supabase.from('user_mentions_mgg2024').insert(rows);
    if (error) console.error('processMentions insert error:', error);
  };

  const value = useMemo(
    () => ({
      getMentionTriggerAt,
      processMentions,
      // You can still expose any other helpers your UI uses, unchanged.
    }),
    []
  );

  return (
    <MentionContext.Provider value={value}>{children}</MentionContext.Provider>
  );
}
