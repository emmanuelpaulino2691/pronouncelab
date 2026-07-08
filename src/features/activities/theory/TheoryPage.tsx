import { useParams } from "react-router-dom";

import { theory } from "../../../shared/data/theory";
import { lessons } from "../../../shared/data/lessons";
import MainLayout from "../../../shared/layouts/MainLayout";

function TheoryPage() {
  const { lessonId } = useParams();

  const blocks = theory[Number(lessonId)] ?? [];

  const lesson = lessons.find(
  (lesson) => lesson.id === Number(lessonId)
);
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
  {lesson?.title}
</h1>

      <div className="mt-8 space-y-6">
        {blocks.map((block, index) => {
          switch (block.type) {
            case "heading":
              return (
                <h2
                  key={index}
                  className="text-2xl font-semibold"
                >
                  {block.text}
                </h2>
              );

            case "paragraph":
              return (
                <p
                  key={index}
                  className="leading-8 text-slate-700"
                >
                  {block.text}
                </p>
              );

            case "tip":
              return (
                <div
                  key={index}
                  className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4"
                >
                  💡 {block.text}
                </div>
              );

            case "image":
              return (
                <img
                  key={index}
                  src={block.src}
                  alt={block.alt}
                  className="mx-auto rounded-xl shadow-md"
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </MainLayout>
  );
}

export default TheoryPage;