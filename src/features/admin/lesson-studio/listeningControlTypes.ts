export const listeningControlTypes = {
  upload: "button",
  replace: "button",
  remove: "button",
  save: "submit",
} as const;

export function preventListeningFormNavigation(
  event: { preventDefault: () => void }
) {
  event.preventDefault();
}
