type Props = {
  src: string;
  alt: string;
};

function ImageBlock({ src, alt }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className="mx-auto rounded-xl shadow-md"
    />
  );
}

export default ImageBlock;