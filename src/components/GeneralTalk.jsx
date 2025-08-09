import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMentionContext } from '@/contexts/MentionContext';

export default function GeneralTalk({ topicId, currentUser, onAdded }) {
  const [text, setText] = useState('');
  const { processMentions } = useMentionContext();

  const handleAddComment = async () => {
    const cleaned = (text || '').trim();
    if (!cleaned) return;

    // 1) Insert first to get the comment id
    const { data, error } = await supabase
      .from('general_topic_comments_mgg2024')
      .insert({
        topic_id: topicId,
        user_id: currentUser.id,
        text: cleaned,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('insert comment error:', error);
      return;
    }

    const commentId = data.id;

    // 2) Store mentions against the COMMENT id (deep-linkable)
    await processMentions(cleaned, 'general_topic_comment', commentId);

    // 3) OPTIONAL: Normalize plain @handles in DB text to @[Display](id)
    // Re-scan locally using the same handle logic by fetching profiles once
    try {
      const { data: profiles } = await supabase
        .from('profiles_mgg2024')
        .select('id, nickname, full_name');

      const handleMap = new Map();
      (profiles || []).forEach((p) => {
        const k1 = (p.nickname || '').toLowerCase();
        const k2 = (p.full_name || '').toLowerCase().replace(/\s+/g, '');
        if (k1) handleMap.set(k1, p);
        if (k2) handleMap.set(k2, p);
      });

      const plainHandleRegex = /@([A-Za-z0-9._-]{2,})/g;
      let needsNormalization = false;
      let normalized = cleaned;

      normalized = normalized.replace(plainHandleRegex, (full, handle) => {
        const u = handleMap.get(handle.toLowerCase());
        if (!u) return full;

        // Avoid double-normalizing if already in @[Display](id) form
        // (Simple guard: leave as-is if full token already matches canonical form)
        if (/^\@\[(.+?)\]\(([a-f0-9-]{16,})\)$/.test(full)) return full;

        const display = u.nickname || u.full_name || handle;
        needsNormalization = true;
        return `@[${display}](${u.id})`;
      });

      if (needsNormalization && normalized !== cleaned) {
        await supabase
          .from('general_topic_comments_mgg2024')
          .update({ text: normalized })
          .eq('id', commentId);
      }
    } catch (e) {
      console.warn('Normalization skipped:', e?.message || e);
    }

    setText('');
    onAdded?.(data); // optional: refresh list
  };

  return (
    <div className="gt-wrap">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment… use @ to mention someone"
      />
      <button onClick={handleAddComment}>Post</button>
    </div>
  );
}
