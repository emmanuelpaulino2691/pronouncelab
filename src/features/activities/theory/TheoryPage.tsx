import { useParams } from "react-router-dom";

import { getLesson } from "../../../shared/services/lessonService";

import BlockRenderer from "../../../shared/components/theory/BlockRenderer";
import MainLayout from "../../../shared/layouts/MainLayout";

function TheoryPage() {
  const { lessonId } = useParams();

  const lessonContent = getLesson(Number(lessonId));

  const blocks = lessonContent?.theory ?? [];

  
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        {lessonContent?.title}
      </h1>

      <div className="mt-8 space-y-6">
        {blocks.map((block, index) => (
          <BlockRenderer
            key={index}
            block={block}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default TheoryPage;