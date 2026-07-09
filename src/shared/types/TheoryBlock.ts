export type TheoryBlock =
  | {
      type: "heading";
      level?: 1 | 2 | 3;
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
  | {
      type: "audio";
      src: string;
    }
  | {
      type: "example";
      title: string;
      text: string;
    };