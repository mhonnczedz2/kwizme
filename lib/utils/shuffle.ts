/**
 * Fisher-Yates shuffle algorithm
 * Shuffles an array in place and returns it
 * Time complexity: O(n)
 * Space complexity: O(1)
 *
 * @param array - The array to shuffle
 * @returns The shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Shuffles an array and returns both the shuffled array and a mapping
 * from shuffled indices to original indices
 *
 * @param array - The array to shuffle
 * @returns Object containing shuffled array and index mapping
 */
export function shuffleWithMapping<T>(array: T[]): {
  shuffled: T[];
  indexMap: number[]; // indexMap[shuffledIndex] = originalIndex
} {
  // Create array of {item, originalIndex} pairs
  const indexed = array.map((item, index) => ({ item, originalIndex: index }));

  // Shuffle the indexed array
  const shuffledIndexed = shuffle(indexed);

  // Extract shuffled items and create index mapping
  const shuffled = shuffledIndexed.map(({ item }) => item);
  const indexMap = shuffledIndexed.map(({ originalIndex }) => originalIndex);

  return { shuffled, indexMap };
}
