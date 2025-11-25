import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Course,
  Lesson,
  Material,
  Module,
  fetchCourse,
  fetchLessons,
  fetchMaterials,
  fetchModules,
} from "@/lib/api";

export default function MaterialsCourse() {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modulesMap, setModulesMap] = useState<Record<number, Module>>({});
  const [lessonsMap, setLessonsMap] = useState<Record<number, Lesson>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(courseId);
    if (!courseId || Number.isNaN(id)) {
      setError(t("errors.courseNotFound") || "Course not found");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courseData, materialsData, modulesData] = await Promise.all([
          fetchCourse(id),
          fetchMaterials({ course: id }),
          fetchModules(id),
        ]);

        setCourse(courseData);
        setMaterials(materialsData);
        setModulesMap(
          modulesData.reduce<Record<number, Module>>((acc, module) => {
            acc[module.id] = module;
            return acc;
          }, {})
        );

        if (modulesData.length > 0) {
          const lessonsResults = await Promise.all(
            modulesData.map((module) => fetchLessons(module.id))
          );
          const lessonsRecord = lessonsResults.flat().reduce<Record<number, Lesson>>((acc, lesson) => {
            acc[lesson.id] = lesson;
            return acc;
          }, {});
          setLessonsMap(lessonsRecord);
        } else {
          setLessonsMap({});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.failedToLoadMaterials"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, t]);

  const pageTitle = useMemo(() => {
    if (course) {
      return course.name;
    }
    return t("materials.courseMaterials");
  }, [course, t]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{pageTitle}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{pageTitle}</PageHeaderHeading>
        </PageHeader>
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="text-destructive text-center">{error}</p>
          <Button variant="outline" onClick={() => navigate("/materials")}>
            {t("materials.backToCourses")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full">
          <div>
            <PageHeaderHeading>{pageTitle}</PageHeaderHeading>
            <p className="text-sm text-muted-foreground">
              {course?.description || t("materials.noCourseDescription")}
            </p>
          </div>
          <div className="flex justify-end w-full self-end md:self-auto md:w-auto">
            <Button variant="outline" onClick={() => navigate("/materials")}>
              {t("materials.backToCourses")}
            </Button>
          </div>
        </div>
      </PageHeader>

      {materials.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("materials.noMaterialsForCourse")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {materials.map((material) => (
            <div key={material.id} className="rounded-md border p-5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{material.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {material.description || t("materials.noDescription")}
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      disabled={!material.file_url}
                      onClick={() => {
                        if (material.file_url) {
                          window.open(material.file_url, "_blank");
                        } else {
                          navigate(`/materials/${material.id}`);
                        }
                      }}
                    >
                      {t("materials.open")}
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize self-start">
                  {t(material.material_type === "reader" ? "materials.reader" : "materials.presentation")}
                </Badge>
              </div>

              <div className="space-y-4">
                {material.modules.length > 0 ? (
                  material.modules.map((moduleId) => {
                    const module = modulesMap[moduleId];
                    if (!module) return null;

                    const moduleLessons = material.lessons
                      .map((lessonId) => lessonsMap[lessonId])
                      .filter(
                        (lesson): lesson is Lesson =>
                          Boolean(lesson) && lesson.module === moduleId
                      );

                    return (
                      <div key={moduleId} className="rounded-md border p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold">{module.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.description || t("materials.noModuleDescription")}
                          </p>
                        </div>
                        {moduleLessons.length > 0 && (
                          <div className="space-y-2">
                            {moduleLessons.map((lesson) => (
                              <div key={lesson.id} className="rounded border p-2">
                                <p className="text-sm font-medium">{lesson.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.description || t("materials.noLessonDescription")}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("materials.noModulesForMaterial")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}


