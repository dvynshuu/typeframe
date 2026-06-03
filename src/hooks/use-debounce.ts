export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let scheduled = false;
  let lastArgs: Parameters<T> | null = null;
  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (lastArgs) fn(...lastArgs);
    });
  };
}
