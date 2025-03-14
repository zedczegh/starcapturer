
/**
 * Soundex implementation for phonetic matching
 * Creates a code that represents the sound of the word
 */
export function soundex(s: string): string {
  const a = s.toLowerCase().split('');
  const firstLetter = a.shift();
  if (!firstLetter) return '';
  
  const codes = {
    b: 1, f: 1, p: 1, v: 1,
    c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
    d: 3, t: 3,
    l: 4,
    m: 5, n: 5,
    r: 6
  } as Record<string, number>;
  
  let output = firstLetter;
  let previous = -1;
  
  for (let i = 0; i < a.length; i++) {
    const current = codes[a[i]] || 0;
    if (current && current !== previous) {
      output += current;
    }
    previous = current;
  }
  
  return (output + '000').slice(0, 4);
}
