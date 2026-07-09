type Props = {
  text: string;
};

function ParagraphBlock({ text }: Props) {
  return (
    <p className="leading-8 text-slate-700">
      {text}
    </p>
  );
}

export default ParagraphBlock;