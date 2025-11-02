import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [name, setName] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [course, setCourse] = useState<number | null>(null);
  const [module, setModule] = useState<number | null>(null);
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
          setModule(group.module);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
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
          setModule((current) => {
            if (current && !mods.some(m => m.id === current)) {
              return null;
            }
            return current;
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load modules");
        }
      } else {
        setModules([]);
        setModule(null);
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
        setError("Name is required");
        setSaving(false);
        return;
      }

      if (!course) {
        setError("Course is required");
        setSaving(false);
        return;
      }

      const payload: Partial<StudentGroup> = {
        name: name.trim(),
        year,
        course,
        module: module || null,
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
      setError(err instanceof Error ? err.message : "Failed to save student group");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{isCreate ? "Create Student Group" : "Edit Student Group"}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Student Group" : "Edit Student Group"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(isCreate ? "/student-groups" : `/student-groups/${id}`)}>
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PageHeader>

      {error && <div className="text-destructive mb-4">{error}</div>}

      <div className="rounded-md border p-4 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Year <span className="text-destructive">*</span>
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
            Course <span className="text-destructive">*</span>
          </label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={course ?? ""}
            onChange={(e) => setCourse(e.target.value ? Number(e.target.value) : null)}
            required
          >
            <option value="">— Select Course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Module</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            value={module ?? ""}
            onChange={(e) => setModule(e.target.value ? Number(e.target.value) : null)}
            disabled={!course || modules.length === 0}
          >
            <option value="">— Select Module —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

