type Props = {
  text: string;
};

function ListeningTranscript({ text }: Props) {
  return (
    <p className="mt-4 whitespace-pre-wrap italic text-slate-500">
      {text}
    </p>
  );
}

export default ListeningTranscript;
