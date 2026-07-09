import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import TipBlock from "./TipBlock";
import ImageBlock from "./ImageBlock";
import AudioBlock from "./AudioBlock";

import type { TheoryBlock } from "../../types/TheoryBlock";

type Props = {
  block: TheoryBlock;
};

function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock text={block.text} />;

    case "paragraph":
      return <ParagraphBlock text={block.text} />;

    case "tip":
      return <TipBlock text={block.text} />;

    case "image":
      return (
        <ImageBlock
          src={block.src}
          alt={block.alt}
        />
      );

    case "audio":
      return (
        <AudioBlock
          src={block.src}
        />
      );

    default:
      return null;
  }
}

export default BlockRenderer;