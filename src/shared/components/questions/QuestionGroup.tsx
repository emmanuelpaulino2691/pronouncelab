import type { ReactNode } from "react";

type Props = {
  totalQuestions: number;
  children: ReactNode;
};

function QuestionGroup({ totalQuestions, children }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Questions: {totalQuestions}
      </p>

      {children}
    </div>
  );
}

export default QuestionGroup;