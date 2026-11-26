// The keys of a tab list (WAI-ARIA APG, tabs with manual activation): the arrow keys move and wrap, Home and End jump.
// Used by the thread feed tabs and the workspace tabs (Task R5.4, R5.6). Returns null for any other key.
export function nextTab(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
