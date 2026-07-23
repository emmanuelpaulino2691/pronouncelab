import { useId, useState, type ReactNode } from "react";

import {
  getToggleSectionLabel,
  toggleSectionButtonType,
} from "./toggleSectionState";

type Props = {
  buttonText: string;
  closeButtonText?: string;
  regionLabel?: string;
  children: ReactNode;
};

function ToggleSection({ buttonText, closeButtonText = "Hide", regionLabel, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const regionId = useId();

  return (
    <div className="mt-4">
      <button
        type={toggleSectionButtonType}
        aria-expanded={isOpen}
        aria-controls={regionId}
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-lg bg-slate-200 px-4 py-2 transition hover:bg-slate-300"
      >
        {getToggleSectionLabel(isOpen, buttonText, closeButtonText)}
      </button>

      {isOpen && (
        <div id={regionId} role="region" aria-label={regionLabel} className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default ToggleSection;
