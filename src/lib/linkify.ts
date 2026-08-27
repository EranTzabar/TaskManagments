const URL_PATTERN =
  /(https?:\/\/[^\s<]+[^\s<.,:;"')\]}]|www\.[^\s<]+[^\s<.,:;"')\]}]|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s<]*)?)/g;

export function normalizeLink(value: string): string {
  if (!value.trim()) {
    return "";
  }

  return value.startsWith("http") ? value : `https://${value}`;
}

export type LinkifyPart = { type: "text"; value: string } | { type: "link"; value: string };

export function splitTextWithLinks(text: string): LinkifyPart[] {
  if (!text) {
    return [];
  }

  const parts: LinkifyPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_PATTERN.lastIndex = 0;
  while ((match = URL_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    parts.push({ type: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}
