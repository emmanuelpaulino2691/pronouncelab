import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

function Card({
  title,
  children,
}: CardProps) {
  return (

    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">

      <h2 className="text-xl font-semibold text-slate-800">
        {title}
      </h2>

      <div className="mt-4 text-slate-600">
        {children}
      </div>

    </div>

  );
}

export default Card;
