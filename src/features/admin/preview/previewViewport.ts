export const previewViewportModes = ["desktop", "tablet", "phone"] as const;
export type PreviewViewportMode = typeof previewViewportModes[number];

export const previewViewportWidths: Record<PreviewViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  phone: "390px",
};

export function previewViewportStyle(mode: PreviewViewportMode) {
  return { width: "100%", maxWidth: previewViewportWidths[mode] } as const;
}

export function previewLayoutContract(mode: PreviewViewportMode) {
  return { shellMode: mode, lessonMode: mode } as const;
}
