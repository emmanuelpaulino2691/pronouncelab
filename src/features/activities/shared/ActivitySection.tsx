import type { ReactNode } from "react";

import Card from "../../../shared/components/ui/Card";

type Props = {
  title: string;
  children: ReactNode;
};

function ActivitySection({ title, children }: Props) {
  return (
    <Card title={title}>
      <div className="mt-4">
        {children}
      </div>
    </Card>
  );
}

export default ActivitySection;