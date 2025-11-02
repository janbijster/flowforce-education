import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  QuestionDetail,
  Option,
  Course,
  Module,
  Lesson,
  Topic,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  createOption,
  updateOption,
  deleteOption,
  fetchCourses,
  fetchModules,
  fetchLessons,
  fetchTopics,
} from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";

interface EditableOption extends Omit<Option, 'id' | 'created_at' | 'updated_at'> {
  id: number | 'new';
  isNew?: boolean;
}

export default function QuestionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course/Module/Lesson/Topic selection
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  // Store initial values for change detection
  const initialValues = useRef<{
    text: string;
    topic: number | null;
    options: EditableOption[];
  }>({
    text: "",
    topic: null,
    options: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [cs] = await Promise.all([
          fetchCourses(),
        ]);
        setCourses(cs);

        if (isCreate) {
          // Initialize empty state for new question
          setText("");
          setOptions([]);
          initialValues.current = {
            text: "",
            topic: null,
            options: [],
          };
        } else {
          // Load existing question
          const q = await fetchQuestion(Number(id));
          setQuestion(q);
          setText(q.text);
          setSelectedTopic(q.topic);
          const opts = (q.options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          initialValues.current = {
            text: q.text,
            topic: q.topic,
            options: opts.map(opt => ({ ...opt })),
          };

          // Load course/module/lesson based on question's topic
          // Fetch all topics and find the matching one to get lesson ID
          const allTopics = await fetchTopics();
          const topic = allTopics.find(t => t.id === q.topic);
          if (topic) {
            setSelectedLesson(topic.lesson);
            // Fetch all lessons to find the matching lesson
            const allLessons = await fetchLessons();
            const lesson = allLessons.find(l => l.id === topic.lesson);
            if (lesson) {
              setSelectedModule(lesson.module);
              // Fetch all modules to find the matching module
              const allModules = await fetchModules();
              const mod = allModules.find(m => m.id === lesson.module);
              if (mod) {
                setSelectedCourse(mod.course);
              }
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load question");
      }
    };
    init();
  }, [id, isCreate]);

  // Fetch modules when course changes
  useEffect(() => {
    const loadModules = async () => {
      if (selectedCourse) {
        try {
          const mods = await fetchModules(selectedCourse);
          setModules(mods);
          // Reset module/lesson/topic if they're not in the new list
          setSelectedModule((current) => {
            if (current && !mods.some(m => m.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load modules");
        }
      } else {
        setModules([]);
        setSelectedModule(null);
      }
    };
    loadModules();
  }, [selectedCourse]);

  // Fetch lessons when module changes
  useEffect(() => {
    const loadLessons = async () => {
      if (selectedModule) {
        try {
          const less = await fetchLessons(selectedModule);
          setLessons(less);
          // Reset lesson/topic if they're not in the new list
          setSelectedLesson((current) => {
            if (current && !less.some(l => l.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load lessons");
        }
      } else {
        setLessons([]);
        setSelectedLesson(null);
      }
    };
    loadLessons();
  }, [selectedModule]);

  // Fetch topics when lesson changes
  useEffect(() => {
    const loadTopics = async () => {
      if (selectedLesson) {
        try {
          const tops = await fetchTopics(selectedLesson);
          setTopics(tops);
          // Reset topic if it's not in the new list
          setSelectedTopic((current) => {
            if (current && !tops.some(t => t.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load topics");
        }
      } else {
        setTopics([]);
        setSelectedTopic(null);
      }
    };
    loadTopics();
  }, [selectedLesson]);

  // Check for unsaved changes
  useEffect(() => {
    const textChanged = text.trim() !== initialValues.current.text.trim();
    const topicChanged = selectedTopic !== initialValues.current.topic;
    const optionsChanged =
      options.length !== initialValues.current.options.length ||
      options.some((opt, idx) => {
        const initOpt = initialValues.current.options[idx];
        if (!initOpt) return true;
        return (
          opt.text.trim() !== initOpt.text.trim() ||
          opt.is_correct !== initOpt.is_correct
        );
      }) ||
      initialValues.current.options.some((initOpt, idx) => {
        const opt = options[idx];
        if (!opt) return true;
        return (
          opt.text.trim() !== initOpt.text.trim() ||
          opt.is_correct !== initOpt.is_correct
        );
      });

    setHasUnsavedChanges(textChanged || topicChanged || optionsChanged);
  }, [text, selectedTopic, options]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      window.onbeforeunload = () => {
        return true;
      };
    } else {
      window.onbeforeunload = null;
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [hasUnsavedChanges]);

  // Block React Router navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && !isSavingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    if (question) {
      navigate(`/questions/${question.id}`);
    } else {
      navigate("/questions");
    }
  };

  const handleAddOption = () => {
    if (!user) return;
    const newOption: EditableOption = {
      id: 'new',
      text: "",
      is_correct: false,
      organization: user.organization.id,
      question: question?.id || 0,
      isNew: true,
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (optionId: number | 'new') => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleUpdateOption = (optionId: number | 'new', field: 'text' | 'is_correct', value: string | boolean) => {
    setOptions(options.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    isSavingRef.current = true;
    setError(null);

    try {
      // Validate required fields
      if (!text.trim()) {
        setError("Question text is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      if (!selectedTopic) {
        setError("Topic is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      if (options.length === 0) {
        setError("At least one option is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      const hasCorrect = options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        setError("At least one option must be marked as correct");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      let questionId: number;

      if (isCreate) {
        // Create new question
        const created = await createQuestion({
          text: text.trim(),
          organization: user.organization.id,
          topic: selectedTopic,
          learning_objectives: [],
        });
        questionId = created.id;
        
        // Create all options
        for (const opt of options) {
          await createOption({
            text: opt.text.trim(),
            is_correct: opt.is_correct,
            organization: user.organization.id,
            question: questionId,
          });
        }

        // Reload question to get full data
        const createdQuestion = await fetchQuestion(questionId);
        setQuestion(createdQuestion);
        setInitialQuestionData(createdQuestion);
        setHasUnsavedChanges(false);
        navigate(`/questions/${questionId}/edit`, { replace: true });
      } else if (question) {
        // Update existing question
        await updateQuestion(question.id, { 
          text: text.trim(),
          topic: selectedTopic,
        });

        // Handle options: create new, update existing, delete removed
        const currentOptionIds = new Set(options.map(opt => typeof opt.id === 'number' ? opt.id : null).filter(Boolean) as number[]);
        const initialOptionIds = new Set(initialValues.current.options.map(opt => opt.id).filter((id): id is number => typeof id === 'number'));

        // Delete removed options
        const toDelete = Array.from(initialOptionIds).filter(id => !currentOptionIds.has(id));
        for (const optId of toDelete) {
          await deleteOption(optId);
        }

        // Create new options and update existing ones
        for (const opt of options) {
          if (opt.id === 'new' || opt.isNew) {
            // Create new option
            await createOption({
              text: opt.text.trim(),
              is_correct: opt.is_correct,
              organization: user.organization.id,
              question: question.id,
            });
          } else if (typeof opt.id === 'number') {
            // Update existing option
            const initOpt = initialValues.current.options.find(o => o.id === opt.id);
            if (!initOpt) continue;

            const changed = opt.text.trim() !== initOpt.text.trim() || opt.is_correct !== initOpt.is_correct;
            if (changed) {
              await updateOption(opt.id, {
                text: opt.text.trim(),
                is_correct: opt.is_correct,
              });
            }
          }
        }

        // Reload question to get updated data
        const updatedQuestion = await fetchQuestion(question.id);
        setQuestion(updatedQuestion);
        setInitialQuestionData(updatedQuestion);
        setHasUnsavedChanges(false);
        navigate(`/questions/${question.id}/edit`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save question");
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100);
    }
  };

  const setInitialQuestionData = (q: QuestionDetail) => {
    setText(q.text);
    setSelectedTopic(q.topic);
    const opts = (q.options || []).map(opt => ({ ...opt }));
    setOptions(opts);
    initialValues.current = {
      text: q.text,
      topic: q.topic,
      options: opts.map(opt => ({ ...opt })),
    };
  };

  // Create a QuestionDetail-like object for preview
  const previewQuestion: QuestionDetail | null = (question || (isCreate && text && selectedTopic)) ? {
    id: question?.id || 0,
    text: text || "",
    organization: user?.organization.id || 0,
    topic: selectedTopic || 0,
    topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
    lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
    module_name: modules.find(m => m.id === selectedModule)?.name || "",
    course_name: courses.find(c => c.id === selectedCourse)?.name || "",
    learning_objectives: [],
    options_count: options.length,
    learning_objectives_count: 0,
    created_at: question?.created_at || "",
    updated_at: question?.updated_at || "",
    options: options.map(opt => ({
      id: typeof opt.id === 'number' ? opt.id : 0,
      text: opt.text,
      is_correct: opt.is_correct,
      organization: opt.organization,
      question: opt.question,
      created_at: typeof opt.id === 'number' ? (question?.options?.find(o => o.id === opt.id)?.created_at || '') : '',
      updated_at: typeof opt.id === 'number' ? (question?.options?.find(o => o.id === opt.id)?.updated_at || '') : '',
    })),
  } : null;

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Question" : "Edit Question"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button
            onClick={handleSave}
            disabled={saving || (!hasUnsavedChanges && !isCreate)}
            variant={!hasUnsavedChanges && !isCreate ? "secondary" : "default"}
          >
            {saving ? "Saving..." : (hasUnsavedChanges ? "Save" : (isCreate ? "Save" : "Changes saved"))}
          </Button>
        </div>
      </PageHeader>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedCourse ?? ""}
                onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Select Course —</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Module</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedModule ?? ""}
                onChange={(e) => setSelectedModule(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedCourse || modules.length === 0}
              >
                <option value="">— Select Module —</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lesson</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedLesson ?? ""}
                onChange={(e) => setSelectedLesson(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedModule || lessons.length === 0}
              >
                <option value="">— Select Lesson —</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Topic <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedTopic ?? ""}
                onChange={(e) => setSelectedTopic(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedLesson || topics.length === 0}
                required
              >
                <option value="">— Select Topic —</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <label className="block text-sm font-medium mb-2">
              Question Text <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter question text"
              required
            />
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b p-3">
              <div className="text-sm font-medium">Options</div>
              <Button size="sm" onClick={handleAddOption}>
                Add Option
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option Text</TableHead>
                    <TableHead className="w-24">Correct</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.length > 0 ? (
                    options.map((option) => (
                      <TableRow key={option.id === 'new' ? `new-${options.indexOf(option)}` : option.id}>
                        <TableCell>
                          <input
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            value={option.text}
                            onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                            placeholder="Enter option text"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={(e) => handleUpdateOption(option.id, 'is_correct', e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveOption(option.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No options. Click "Add Option" to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div>
          <QuestionPreview question={previewQuestion} />
        </div>
      </div>
    </>
  );
}