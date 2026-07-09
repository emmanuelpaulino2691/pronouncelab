type Props = {
  text: string;
};

function HeadingBlock({ text }: Props) {
  return (
    <h2 className="text-2xl font-semibold">
      {text}
    </h2>
  );
}

export default HeadingBlock;