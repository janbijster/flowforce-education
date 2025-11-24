import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Material,
  MaterialDetail,
  Course,
  Module,
  Lesson,
  Topic,
  fetchMaterial,
  createMaterial,
  updateMaterial,
  fetchCourses,
  fetchModules,
  fetchLessons,
  fetchTopics,
} from "@/lib/api";

export default function MaterialForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<'reader' | 'presentation'>('reader');
  const [order, setOrder] = useState(0);
  const [content, setContent] = useState("");
  const [slideCount, setSlideCount] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Course hierarchy
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  // Load all available options when course changes
  useEffect(() => {
    const loadHierarchy = async () => {
      if (selectedCourse) {
        try {
          const [mods, allLessons, allTopics] = await Promise.all([
            fetchModules(selectedCourse),
            fetchLessons(),
            fetchTopics(),
          ]);
          
          // Filter lessons and topics that belong to modules in the selected course
          const courseModules = mods.map(m => m.id);
          const filteredLessons = allLessons.filter(l => 
            courseModules.includes(l.module)
          );
          const filteredTopics = allTopics.filter(t => 
            filteredLessons.some(l => l.id === t.lesson)
          );
          
          setModules(mods);
          setLessons(filteredLessons);
          setTopics(filteredTopics);
        } catch (e) {
          console.error("Failed to load course hierarchy:", e);
        }
      } else {
        setModules([]);
        setLessons([]);
        setTopics([]);
        setSelectedModules([]);
        setSelectedLessons([]);
        setSelectedTopics([]);
      }
    };
    loadHierarchy();
  }, [selectedCourse]);

  useEffect(() => {
    const init = async () => {
      try {
        const [cs, mat] = await Promise.all([
          fetchCourses(),
          !isCreate && id ? fetchMaterial(Number(id)) : null,
        ]);
        
        setCourses(cs);
        
        if (mat) {
          setMaterial(mat);
          setTitle(mat.title);
          setDescription(mat.description || "");
          setMaterialType(mat.material_type);
          setOrder(mat.order);
          setContent(mat.content || "");
          setSlideCount(mat.slide_count);
          setFileUrl(mat.file_url);
          setSelectedCourse(mat.course);
          setSelectedModules(mat.modules);
          setSelectedLessons(mat.lessons);
          setSelectedTopics(mat.topics);
        } else {
          // Initialize for new material
          if (user?.organization) {
            // Pre-select first course if available
            if (cs.length > 0) {
              setSelectedCourse(cs[0].id);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isCreate, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Clear existing file URL when new file is selected
      setFileUrl(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!user?.organization) {
      setError("Organization not found");
      return;
    }

    if (!selectedCourse) {
      setError("Course is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<Material> & { file?: File } = {
        title: title.trim(),
        description: description.trim() || null,
        material_type: materialType,
        order,
        organization: user.organization.id,
        course: selectedCourse,
        modules: selectedModules,
        lessons: selectedLessons,
        topics: selectedTopics,
        content: content.trim() || null,
        slide_count: slideCount,
      };

      if (file) {
        payload.file = file;
      }

      if (isCreate) {
        await createMaterial(payload);
      } else if (id) {
        await updateMaterial(Number(id), payload);
      }

      navigate("/materials/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save material");
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleLesson = (lessonId: number) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const toggleTopic = (topicId: number) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{isCreate ? "New Material" : "Edit Material"}</PageHeaderHeading>
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
        <PageHeaderHeading>{isCreate ? "New Material" : "Edit Material"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/materials/overview")}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !title.trim() || !selectedCourse}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border px-3 py-2 min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Material Type *</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as 'reader' | 'presentation')}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="reader">Reader</option>
                <option value="presentation">Presentation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2"
                min="0"
              />
            </div>
          </div>

          {materialType === 'presentation' && (
            <div>
              <label className="block text-sm font-medium mb-1">Slide Count</label>
              <input
                type="number"
                value={slideCount || ""}
                onChange={(e) => setSlideCount(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border px-3 py-2"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Course Hierarchy */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Course Hierarchy</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Course *</label>
            <select
              value={selectedCourse || ""}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border px-3 py-2"
              required
            >
              <option value="">-- Select a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Modules</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {modules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No modules available</p>
                  ) : (
                    modules.map((module) => (
                      <label key={module.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.id)}
                          onChange={() => toggleModule(module.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{module.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lessons</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {lessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No lessons available</p>
                  ) : (
                    lessons.map((lesson) => (
                      <label key={lesson.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLessons.includes(lesson.id)}
                          onChange={() => toggleLesson(lesson.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{lesson.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Topics</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {topics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No topics available</p>
                  ) : (
                    topics.map((topic) => (
                      <label key={topic.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(topic.id)}
                          onChange={() => toggleTopic(topic.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{topic.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Content</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">File (PDF, DOCX, PPTX, etc.)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.pptx,.doc,.ppt"
              className="w-full rounded-md border px-3 py-2"
            />
            {fileUrl && !file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Current file: <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{fileUrl}</a>
              </p>
            )}
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rich Text Content (HTML or Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-md border px-3 py-2 min-h-[200px] font-mono text-sm"
              placeholder="Enter HTML or Markdown content..."
            />
          </div>
        </div>
      </div>
    </>
  );
}

