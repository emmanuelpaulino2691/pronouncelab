type Props = {
  text: string;
};

function TipBlock({ text }: Props) {
  return (
    <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
      💡 {text}
    </div>
  );
}

export default TipBlock;