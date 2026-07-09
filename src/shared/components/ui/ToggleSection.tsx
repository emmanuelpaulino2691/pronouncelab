import { useState, type ReactNode } from "react";

type Props = {
  buttonText: string;
  children: ReactNode;
};

function ToggleSection({ buttonText, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-lg bg-slate-200 px-4 py-2 transition hover:bg-slate-300"
      >
        {isOpen ? "Hide" : buttonText}
      </button>

      {isOpen && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default ToggleSection;