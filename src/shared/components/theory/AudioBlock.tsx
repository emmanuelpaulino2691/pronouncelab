type Props = {
  src: string;
};

function AudioBlock({ src }: Props) {
    console.log("AudioBlock rendered:", src);
  return (
    <audio controls className="w-full">
      <source src={src} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}

export default AudioBlock;