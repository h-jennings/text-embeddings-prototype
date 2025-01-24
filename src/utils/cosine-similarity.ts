export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = dot(a, b);
  const magnitudeA = Math.sqrt(dot(a, a));
  const magnitudeB = Math.sqrt(dot(b, b));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}
function dot(a: number[], b: number[]): number {
  return a.reduce((sum, val, index) => sum + val * b[index], 0);
}
