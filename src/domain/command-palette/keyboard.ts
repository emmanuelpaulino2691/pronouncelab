export function moveActiveIndex(current: number, direction: -1 | 1, resultCount: number) {
  if (resultCount <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : resultCount - 1;
  return (current + direction + resultCount) % resultCount;
}

export function isCommandPaletteShortcut(event: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }) {
  if (event.altKey) return false;
  const modifier = event.ctrlKey || event.metaKey;
  return modifier && (event.key.toLocaleLowerCase() === "k" || (event.ctrlKey && event.shiftKey && event.key.toLocaleLowerCase() === "p"));
}
