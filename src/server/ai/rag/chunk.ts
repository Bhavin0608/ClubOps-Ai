export interface TextChunk {
  content: string;
  chunkIndex: number;
  locator?: string;
}

export function chunkText(
  text: string,
  targetSize = 900,
  overlap = 150,
  minSize = 80,
  locatorPrefix = "section"
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= targetSize) {
    return [{ content: normalized, chunkIndex: 0, locator: `${locatorPrefix} 1` }];
  }

  // Split into paragraphs
  const paragraphs = normalized.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length <= targetSize) {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    } else {
      if (currentChunk.length >= minSize) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          locator: `${locatorPrefix} ${chunkIndex}`,
        });
        // Carry over overlap from the end of the previous chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + "\n\n" + para;
      } else {
        currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
      }
    }
  }

  if (currentChunk.trim().length >= minSize) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      locator: `${locatorPrefix} ${chunkIndex}`,
    });
  }

  return chunks;
}
