import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingError } from "@/components/LoadingError";
import { FilterSelect } from "@/components/FilterSelect";
import {
  fetchMaterials,
  fetchCourses,
  fetchModules,
  fetchLessons,
  fetchTopics,
  Material,
  Course,
  Module,
  Lesson,
  Topic,
  deleteMaterial,
} from "@/lib/api";

export default function MaterialsOverview() {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mats, cs] = await Promise.all([
          fetchMaterials(),
          fetchCourses(),
        ]);
        setMaterials(mats);
        setCourses(cs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load materials");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadModules = async () => {
      if (selectedCourse) {
        try {
          const mods = await fetchModules(selectedCourse);
          setModules(mods);
          setSelectedModule((current) => {
            if (current && !mods.some(m => m.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          console.error("Failed to load modules:", e);
        }
      } else {
        setModules([]);
        setSelectedModule(null);
      }
    };
    loadModules();
  }, [selectedCourse]);

  useEffect(() => {
    const loadLessons = async () => {
      if (selectedModule) {
        try {
          const less = await fetchLessons(selectedModule);
          setLessons(less);
          setSelectedLesson((current) => {
            if (current && !less.some(l => l.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          console.error("Failed to load lessons:", e);
        }
      } else {
        setLessons([]);
        setSelectedLesson(null);
      }
    };
    loadLessons();
  }, [selectedModule]);

  useEffect(() => {
    const loadTopics = async () => {
      if (selectedLesson) {
        try {
          const tops = await fetchTopics(selectedLesson);
          setTopics(tops);
          setSelectedTopic((current) => {
            if (current && !tops.some(t => t.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          console.error("Failed to load topics:", e);
        }
      } else {
        setTopics([]);
        setSelectedTopic(null);
      }
    };
    loadTopics();
  }, [selectedLesson]);

  useEffect(() => {
    const loadFilteredMaterials = async () => {
      try {
        setLoading(true);
        const params: {
          course?: number;
          modules?: number[];
          lessons?: number[];
          topics?: number[];
        } = {};

        if (selectedCourse) params.course = selectedCourse;
        if (selectedModule) params.modules = [selectedModule];
        if (selectedLesson) params.lessons = [selectedLesson];
        if (selectedTopic) params.topics = [selectedTopic];

        const mats = await fetchMaterials(params);
        setMaterials(mats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load materials");
      } finally {
        setLoading(false);
      }
    };

    loadFilteredMaterials();
  }, [selectedCourse, selectedModule, selectedLesson, selectedTopic]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("errors.areYouSureDelete"))) {
      return;
    }
    try {
      await deleteMaterial(id);
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("errors.failedToDeleteMaterial"));
    }
  };

  const handleRowClick = (id: number) => {
    navigate(`/materials/${id}`);
  };

  return (
    <LoadingError loading={loading && materials.length === 0} error={error && materials.length === 0 ? error : null} title={t("materials.materialsOverview")}>
      <PageHeader>
        <PageHeaderHeading>{t("materials.materialsOverview")}</PageHeaderHeading>
        <Button onClick={() => navigate("/materials/new")}>{t("materials.newMaterial")}</Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label={t("materials.filterByCourse")}
          value={selectedCourse}
          options={courses}
          onChange={setSelectedCourse}
          allLabel={t("materials.allCourses")}
          fullWidth
        />
        <FilterSelect
          label={t("materials.filterByModule")}
          value={selectedModule}
          options={modules}
          onChange={setSelectedModule}
          allLabel={t("materials.allModules")}
          disabled={!selectedCourse || modules.length === 0}
          fullWidth
        />
        <FilterSelect
          label={t("materials.filterByLesson")}
          value={selectedLesson}
          options={lessons}
          onChange={setSelectedLesson}
          allLabel={t("materials.allLessons")}
          disabled={!selectedModule || lessons.length === 0}
          fullWidth
        />
        <FilterSelect
          label={t("materials.filterByTopic")}
          value={selectedTopic}
          options={topics}
          onChange={setSelectedTopic}
          allLabel={t("materials.allTopics")}
          disabled={!selectedLesson || topics.length === 0}
          fullWidth
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("materials.loadingMaterials")}</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("materials.noMaterials")}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("materials.title")}</TableHead>
                <TableHead>{t("materials.type")}</TableHead>
                <TableHead>{t("materials.course")}</TableHead>
                <TableHead>{t("materials.modules")}</TableHead>
                <TableHead>{t("materials.lessons")}</TableHead>
                <TableHead>{t("materials.topics")}</TableHead>
                <TableHead className="w-32">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  onClick={() => handleRowClick(material.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{material.title}</TableCell>
                  <TableCell>
                    <span className="capitalize">{material.material_type}</span>
                  </TableCell>
                  <TableCell>{material.course_name || "-"}</TableCell>
                  <TableCell>
                    {material.modules_names.length > 0
                      ? material.modules_names.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {material.lessons_names.length > 0
                      ? material.lessons_names.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {material.topics_names.length > 0
                      ? material.topics_names.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/materials/${material.id}/edit`)}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => handleDelete(material.id, e)}
                      >
                        {t("common.delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </LoadingError>
  );
}
