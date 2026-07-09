type Props = {
  text: string;
  level?: 1 | 2 | 3;
};

function HeadingBlock({
  text,
  level = 2,
}: Props) {
  switch (level) {
    case 1:
      return (
        <h1 className="text-3xl font-bold">
          {text}
        </h1>
      );

    case 3:
      return (
        <h3 className="text-xl font-semibold">
          {text}
        </h3>
      );

    default:
      return (
        <h2 className="text-2xl font-semibold">
          {text}
        </h2>
      );
  }
}

export default HeadingBlock;