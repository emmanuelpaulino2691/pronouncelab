type Props = {
  src: string;
};

function AudioPlayer({ src }: Props) {
  return (
    <audio controls className="mt-4 w-full">
      <source src={src} />
      Your browser does not support the audio element.
    </audio>
  );
}

export default AudioPlayer;