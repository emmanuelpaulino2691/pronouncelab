type Props = {
  src: string;
  label?: string;
  transcript?: string;
};

function AudioBlock({ src, label, transcript }: Props) {
  const visibleTranscript = transcript?.trim();
  return (
    <section className="space-y-3">
      {label && <h3 className="font-semibold text-slate-950">{label}</h3>}
      <audio controls className="w-full">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {visibleTranscript && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Transcript</p>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{visibleTranscript}</p>
        </div>
      )}
    </section>
  );
}

export default AudioBlock;
