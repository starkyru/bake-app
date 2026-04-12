import { useMemo } from 'react';

export function parseInstructionSteps(text: string | undefined): string[] {
  if (!text?.trim()) return [];

  // Strategy 1: Split by numbered patterns (1. , 1) , Step 1:)
  const numberedPattern = /(?:^|\n)\s*(?:\d+[.)]\s*|[Ss]tep\s+\d+[:.]\s*)/;
  if (numberedPattern.test(text)) {
    const parts = text
      .split(/(?:^|\n)\s*(?:\d+[.)]\s*|[Ss]tep\s+\d+[:.]\s*)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length > 1) return parts;
  }

  // Strategy 2: Split by double newlines
  const byParagraph = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (byParagraph.length > 1) return byParagraph;

  // Strategy 3: Split by single newlines (substantial lines only)
  const byLine = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  if (byLine.length > 1) return byLine;

  // Fallback: entire text as one step
  return [text.trim()];
}

export function useInstructionSteps(instructions: string | undefined) {
  return useMemo(() => parseInstructionSteps(instructions), [instructions]);
}
