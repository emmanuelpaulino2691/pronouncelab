export type TheoryBlock =
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "tip";
      text: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
    }
    ;