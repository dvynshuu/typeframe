/** Human-readable aspect label for template chips */
export function aspectLabel(width: number, height: number): string {
  const r = width / height;
  if (Math.abs(r - 1) < 0.04) return '1∶1';
  if (Math.abs(r - 16 / 9) < 0.04) return '16∶9';
  if (Math.abs(r - 9 / 16) < 0.04) return '9∶16';
  if (Math.abs(r - 4 / 5) < 0.04) return '4∶5';
  if (Math.abs(r - 4 / 3) < 0.04) return '4∶3';
  if (Math.abs(r - 3 / 2) < 0.04) return '3∶2';
  return `${width}×${height}`;
}
