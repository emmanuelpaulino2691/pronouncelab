import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import { hasLearnerLoadFailure } from "../../shared/content/learnerResourcePresentation";
import type { ContentId, LearnerCourse, LearnerLesson, LearnerUnit } from "../../shared/content/contracts/learnerContent";
import { contentFailure, contentSuccess } from "../../shared/content/errors/contentErrors";
import LessonPlayer from "./LessonPlayer";
import { loadUserProgress } from "../../shared/utils/progressStorage";
import { isLearnerLessonUnlocked, isLearnerUnitUnlocked } from "../learner-journey/learnerJourney";

type LessonContext = { lesson: LearnerLesson; unit: LearnerUnit; course: LearnerCourse };

function LessonPage() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(lessonId) ? lessonId as unknown as ContentId : null;
  const resource = useLearnerResource<LessonContext>(async (signal) => {
    if (!validId) return contentFailure("not_found", "Lesson not found.");
    const lessonResult = await learnerContentProvider.getLesson(validId, signal);
    if (!lessonResult.ok) return lessonResult;
    const unitResult = await learnerContentProvider.getUnit(lessonResult.value.unitId, signal);
    if (!unitResult.ok) return unitResult;
    const courseResult = await learnerContentProvider.getCourse(unitResult.value.courseId, signal);
    if (!courseResult.ok) return courseResult;
    return contentSuccess({ lesson: lessonResult.value, unit: unitResult.value, course: courseResult.value }, lessonResult.revision);
  }, [validId]);

  if (hasLearnerLoadFailure(resource.loading, resource.error)) return <MainLayout><section className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-2xl font-bold">Lesson could not be loaded</h1><p className="mt-2">{resource.error?.message}</p><button type="button" onClick={resource.retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Try again</button></section></MainLayout>;
  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Lesson unavailable" message="This lesson does not exist or is no longer published." actionLabel="Browse Courses" onAction={() => navigate("/courses")} /></MainLayout>;
  if (!resource.value) return <MainLayout immersive><p role="status">Loading published lesson…</p></MainLayout>;

  const { lesson, unit, course } = resource.value;
  const progress = loadUserProgress();
  if (!isLearnerUnitUnlocked(course, unit.id, progress) || !isLearnerLessonUnlocked(unit, lesson.id, progress)) return <MainLayout><NotFoundState title="Lesson locked" message="Complete the previous learning content to unlock this lesson." actionLabel="Return to course" onAction={() => navigate(`/courses/${course.id}`)} /></MainLayout>;
  return <MainLayout immersive><LessonPlayer key={lesson.id} lesson={lesson} returnPath={`/units/${unit.id}`} contextLabel={unit.title} /></MainLayout>;
}

export default LessonPage;
