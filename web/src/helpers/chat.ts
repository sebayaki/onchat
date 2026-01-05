import type { ReactNode } from "react";

// Parse reply format: #{number} - content
// Returns { replyToIndex, content } if it's a reply, or { replyToIndex: undefined, content } if not
export function parseReplyContent(content: string | ReactNode): {
  replyToIndex: number | undefined;
  displayContent: string | ReactNode;
} {
  if (typeof content !== "string") {
    return { replyToIndex: undefined, displayContent: content };
  }

  const replyMatch = content.match(/^#(\d+)\s*-\s*/);
  if (replyMatch) {
    const replyToIndex = parseInt(replyMatch[1], 10);
    const displayContent = content.slice(replyMatch[0].length);
    return { replyToIndex, displayContent };
  }

  return { replyToIndex: undefined, displayContent: content };
}
