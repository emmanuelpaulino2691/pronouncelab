type Props = {
  src: string;
};

function AudioPlayer({ src }: Props) {
  return (
    <audio controls preload="metadata" aria-label="Listening audio" className="mt-4 w-full">
      <source src={src} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}

export default AudioPlayer;
