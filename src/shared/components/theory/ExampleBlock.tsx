type Props = {
  title?: string;
  text: string;
};

function ExampleBlock({ title = "Example", text }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-3 font-mono text-lg">
        {text}
      </p>
    </div>
  );
}

export default ExampleBlock;