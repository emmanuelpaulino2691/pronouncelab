import BlockRenderer from "./BlockRenderer";

import type { TheoryBlock } from "../../types/TheoryBlock";

type Props = {
  blocks: TheoryBlock[];
};

function TheoryRenderer({ blocks }: Props) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <BlockRenderer
          key={index}
          block={block}
        />
      ))}
    </div>
  );
}

export default TheoryRenderer;