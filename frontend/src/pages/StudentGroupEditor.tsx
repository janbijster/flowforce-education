import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  StudentGroup,
  fetchStudentGroup,
  createStudentGroup,
  updateStudentGroup,
  fetchCourses,
  fetchModules,
  Course,
  Module,
} from "@/lib/api";

export default function StudentGroupEditor() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [name, setName] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [course, setCourse] = useState<number | null>(null);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const cs = await fetchCourses();
        setCourses(cs);

        if (!isCreate && id) {
          const group = await fetchStudentGroup(Number(id));
          setName(group.name);
          setYear(group.year);
          setCourse(group.course);
          setSelectedModules(group.modules || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadData"));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isCreate]);

  useEffect(() => {
    const loadModules = async () => {
      if (course) {
        try {
          const mods = await fetchModules(course);
          setModules(mods);
          setSelectedModules((current) => {
            return current.filter(id => mods.some(m => m.id === id));
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : t("errors.failedToLoadModules"));
        }
      } else {
        setModules([]);
        setSelectedModules([]);
      }
    };
    loadModules();
  }, [course]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) {
        setError(t("studentGroups.nameRequired"));
        setSaving(false);
        return;
      }

      if (!course) {
        setError(t("errors.courseRequired"));
        setSaving(false);
        return;
      }

      const payload: Partial<StudentGroup> = {
        name: name.trim(),
        year,
        course,
        modules: selectedModules,
        organization: user.organization.id,
      };

      if (isCreate) {
        const created = await createStudentGroup(payload);
        navigate(`/student-groups/${created.id}`);
      } else if (id) {
        await updateStudentGroup(Number(id), payload);
        navigate(`/student-groups/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("studentGroups.failedToSaveStudentGroup"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{isCreate ? t("studentGroups.createStudentGroup") : t("studentGroups.editStudentGroup")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? t("studentGroups.createStudentGroup") : t("studentGroups.editStudentGroup")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(isCreate ? "/student-groups" : `/student-groups/${id}`)}>
            {t("common.back")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </PageHeader>

      {error && <div className="text-destructive mb-4">{error}</div>}

      <div className="rounded-md border p-4 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("common.name")} <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("studentGroups.enterGroupName")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("common.year")} <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("quizzes.course")} <span className="text-destructive">*</span>
          </label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={course ?? ""}
            onChange={(e) => setCourse(e.target.value ? Number(e.target.value) : null)}
            required
          >
            <option value="">{t("studentGroups.selectCoursePlaceholder")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("materials.modules")}</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50 min-h-[100px]"
            multiple
            value={selectedModules.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
              setSelectedModules(selected);
            }}
            disabled={!course || modules.length === 0}
            style={{ minHeight: '120px' }}
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {t("studentGroups.holdToSelectModules")}
          </p>
          {selectedModules.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("studentGroups.selectedModules")} {selectedModules.length} {selectedModules.length !== 1 ? t("studentGroups.modules") : t("studentGroups.module")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

