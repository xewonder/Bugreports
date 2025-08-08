import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// In-memory stores to simulate database tables
const comments = [];
const notifications = [];

/**
 * Adds a comment and extracts any user mentions, creating
 * notification entries for mentioned users.
 * @param {Object} commenter - Commenting user
 * @param {string} text - Comment text, may contain @[username](id)
 * @returns {Object} The stored comment object
 */
function addCommentWithMention(commenter, text) {
  const commentId = crypto.randomUUID();
  const comment = { id: commentId, user_id: commenter.id, text };
  comments.push(comment);

  const mentionRegex = /@\[(?<username>[^\]]+)\]\((?<id>[^)]+)\)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    notifications.push({
      mentioned_user_id: match.groups.id,
      mentioned_by_id: commenter.id,
      content_type: 'comment',
      content_id: commentId,
    });
  }

  return comment;
}

// Sample users
const commenter = { id: 'user-1', username: 'alice' };
const mentioned = { id: 'user-2', username: 'bob' };

// Insert a comment containing a mention
const commentText = `Hello @[${mentioned.username}](${mentioned.id}), welcome!`;
const comment = addCommentWithMention(commenter, commentText);

// Verify the stored text contains the mention pattern
console.log('Stored comment text:', comment.text);
assert(comment.text.includes(`@[${mentioned.username}](${mentioned.id})`),
  'Comment did not store the mention text.');

// Verify a notification entry exists for the mentioned user
const notification = notifications.find(
  (n) => n.mentioned_user_id === mentioned.id && n.content_id === comment.id,
);
assert(notification, 'Notification entry was not created for the mentioned user.');
console.log('Notification entry:', notification);

console.log('✅ Mention reproduction test passed');
