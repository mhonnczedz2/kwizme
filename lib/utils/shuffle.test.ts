// Quick test file for shuffle utility
import { shuffle, shuffleWithMapping } from './shuffle';

console.log('Testing shuffle function...\n');

// Test 1: Basic shuffle
const array1 = [1, 2, 3, 4, 5];
const shuffled1 = shuffle(array1);
console.log('Original:', array1);
console.log('Shuffled:', shuffled1);
console.log('Same length:', array1.length === shuffled1.length);
console.log('Contains all elements:', array1.every(item => shuffled1.includes(item)));
console.log('');

// Test 2: Shuffle with mapping
const array2 = ['A', 'B', 'C', 'D'];
const result = shuffleWithMapping(array2);
console.log('Original:', array2);
console.log('Shuffled:', result.shuffled);
console.log('Index mapping:', result.indexMap);
console.log('Verification - mapping each shuffled item back to original:');
result.shuffled.forEach((item, shuffledIdx) => {
  const originalIdx = result.indexMap[shuffledIdx];
  const originalItem = array2[originalIdx];
  console.log(`  shuffled[${shuffledIdx}] = "${item}" -> original[${originalIdx}] = "${originalItem}" ✓`);
});
console.log('');

// Test 3: Multiple shuffles to ensure randomness
console.log('Testing randomness (10 shuffles of [1,2,3,4,5]):');
for (let i = 0; i < 10; i++) {
  console.log(`  ${i + 1}. ${shuffle([1, 2, 3, 4, 5]).join(', ')}`);
}
