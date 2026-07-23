export function getToggleSectionLabel(
  isOpen: boolean,
  buttonText: string,
  closeButtonText = "Hide"
) {
  return isOpen ? closeButtonText : buttonText;
}

export const toggleSectionButtonType = "button" as const;
