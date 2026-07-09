type Props = {
  text: string;
};

function ListeningInstructions({ text }: Props) {
  return (
    <p className="text-slate-600">
      {text}
    </p>
  );
}

export default ListeningInstructions;