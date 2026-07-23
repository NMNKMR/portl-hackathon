export const MAX_FLAT_RANGE_SIZE = 50;

export function parseNumericFlatRange(start: string, end: string): {
  numbers: string[];
  error?: string;
} {
  const startTrim = start.trim();
  const endTrim = end.trim();

  if (!startTrim || !endTrim) {
    return { numbers: [], error: 'Enter start and end flat numbers' };
  }

  if (!/^\d+$/.test(startTrim) || !/^\d+$/.test(endTrim)) {
    return { numbers: [], error: 'Use numeric flat numbers only' };
  }

  const startNum = Number.parseInt(startTrim, 10);
  const endNum = Number.parseInt(endTrim, 10);

  if (startNum > endNum) {
    return { numbers: [], error: 'Start must be less than or equal to end' };
  }

  const count = endNum - startNum + 1;
  if (count > MAX_FLAT_RANGE_SIZE) {
    return {
      numbers: [],
      error: `Maximum ${MAX_FLAT_RANGE_SIZE} flats per range`,
    };
  }

  const padLen = Math.max(startTrim.length, endTrim.length);
  const numbers: string[] = [];
  for (let i = startNum; i <= endNum; i += 1) {
    numbers.push(String(i).padStart(padLen, '0'));
  }

  return { numbers };
}

export function formatRangePreview(numbers: string[]): string {
  if (numbers.length === 0) return '';
  if (numbers.length <= 4) return numbers.join(', ');
  return `${numbers[0]}, ${numbers[1]}, ${numbers[2]} … ${numbers[numbers.length - 1]}`;
}
