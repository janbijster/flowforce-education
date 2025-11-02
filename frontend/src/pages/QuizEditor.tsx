import { useEffect, useMemo, useState, useRef } from "react";
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
  Quiz,
  QuizDetail,
  Question,
  Course,
  Module,
  fetchQuiz,
  createQuiz,
  updateQuiz,
  searchQuestions,
  assignQuestionToQuiz,
  reorderQuizQuestions,
  fetchCourses,
  fetchModules,
} from "@/lib/api";

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [initialQuestionIds, setInitialQuestionIds] = useState<number[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  
  // Store initial values for change detection
  const initialValues = useRef<{
    name: string;
    description: string;
    course: number | null;
    module: number | null;
    questionIds: number[];
  }>({
    name: "",
    description: "",
    course: null,
    module: null,
    questionIds: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [q, cs, qs] = await Promise.all([
          !isCreate && id ? fetchQuiz(Number(id)) : null,
          fetchCourses(),
          searchQuestions({ search: "" }),
        ]);
        
        setCourses(cs);
        setAllQuestions(qs);
        
        if (q) {
          setQuiz(q);
          const qIds = q.questions.map(q => q.id);
          setInitialQuestionIds(qIds);
          const initName = q.name ?? "";
          const initDesc = q.description ?? "";
          const initCourse = q.course;
          const initModule = q.module;
          setName(initName);
          setDescription(initDesc || "");
          setSelectedCourse(initCourse);
          setSelectedModule(initModule);
          // Store initial values
          initialValues.current = {
            name: initName,
            description: initDesc ?? "",
            course: initCourse,
            module: initModule,
            questionIds: qIds,
          };
          if (q.course) {
            const mods = await fetchModules(q.course);
            setModules(mods);
          }
        } else {
          // initialize empty quiz state for create flow
          setQuiz({
            id: 0,
            name: "",
            description: null,
            organization: 0,
            course: null,
            module: null,
            lessons: [],
            topics: [],
            course_name: null,
            module_name: null,
            questions_count: 0,
            created_at: "",
            updated_at: "",
            questions: [],
          });
          setInitialQuestionIds([]);
          initialValues.current = {
            name: "",
            description: "",
            course: null,
            module: null,
            questionIds: [],
          };
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load quiz data");
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
          // Reset module if it's not in the new list
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

  // Check for unsaved changes
  useEffect(() => {
    if (!quiz) return;

    const currentQuestionIds = (quiz.questions || []).map(q => q.id);
    const initialQuestionIds = initialValues.current.questionIds;

    // Check if question IDs changed (add/remove)
    const questionIdsChanged = 
      currentQuestionIds.length !== initialQuestionIds.length ||
      !currentQuestionIds.every((id, idx) => id === initialQuestionIds[idx]);

    // Check if order changed (same IDs but different order)
    const orderChanged = 
      currentQuestionIds.length === initialQuestionIds.length &&
      currentQuestionIds.length > 0 &&
      currentQuestionIds.every(id => initialQuestionIds.includes(id)) &&
      !currentQuestionIds.every((id, idx) => id === initialQuestionIds[idx]);

    const hasChanges = 
      name.trim() !== initialValues.current.name.trim() ||
      (description ?? "").trim() !== initialValues.current.description.trim() ||
      selectedCourse !== initialValues.current.course ||
      selectedModule !== initialValues.current.module ||
      questionIdsChanged ||
      orderChanged;

    setHasUnsavedChanges(hasChanges);
  }, [name, description, selectedCourse, selectedModule, quiz]);

  const filteredLeft = useMemo(() => {
    const s = search.trim().toLowerCase();
    const inQuizIds = new Set((quiz?.questions || []).map((q) => q.id));
    return allQuestions
      .filter((q) => !inQuizIds.has(q.id))
      .filter((q) => (s ? q.text.toLowerCase().includes(s) : true));
  }, [allQuestions, quiz, search]);

  const handleAdd = (question: Question) => {
    if (!quiz) return;
    if (quiz.questions.some(q => q.id === question.id)) return;
    setQuiz({ ...quiz, questions: [...quiz.questions, question] });
  };

  const handleRemove = (question: Question) => {
    if (!quiz) return;
    setQuiz({ ...quiz, questions: quiz.questions.filter((q) => q.id !== question.id) });
  };

  // Simple HTML5 drag-reorder (client-side only for now)
  const [dragId, setDragId] = useState<number | null>(null);
  const onDragStart = (id: number) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetId: number) => {
    if (!quiz || dragId == null || dragId === targetId) return;
    const curr = [...quiz.questions];
    const fromIdx = curr.findIndex((q) => q.id === dragId);
    const toIdx = curr.findIndex((q) => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = curr.splice(fromIdx, 1);
    curr.splice(toIdx, 0, moved);
    setQuiz({ ...quiz, questions: curr });
    setDragId(null);
  };

  // Warn before leaving with unsaved changes (browser actions: refresh, close tab, navigate to different site)
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

  // Handle Back button click with unsaved changes warning
  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    navigate("/quizzes");
  };

  const handleSave = async () => {
    setSaving(true);
    isSavingRef.current = true;
    setError(null);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate required fields
      if (!name.trim()) {
        setError("Name is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }
      if (!description.trim()) {
        setError("Description is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      let quizId = quiz?.id ?? 0;
      if (isCreate) {
        const created: Quiz = await createQuiz({
          name: name.trim(),
          description: description.trim(),
          organization: user.organization.id,
          course: selectedCourse,
          module: selectedModule,
        });
        quizId = created.id;
      } else if (quiz) {
        await updateQuiz(quiz.id, {
          name: name.trim(),
          description: description.trim(),
          organization: user.organization.id,
          course: selectedCourse,
          module: selectedModule,
        });
      }

      // Persist add/remove by updating the question.quiz field
      const desiredIds = new Set((quiz?.questions || []).map(q => q.id));
      const toAdd: number[] = Array.from(desiredIds).filter(id => !initialQuestionIds.includes(id));
      const toRemove: number[] = initialQuestionIds.filter(id => !desiredIds.has(id));

      for (const qid of toAdd) {
        await assignQuestionToQuiz(qid, quizId);
      }
      for (const qid of toRemove) {
        await assignQuestionToQuiz(qid, null);
      }

      // Persist ordering
      const orderedIds = (quiz?.questions || []).map(q => q.id);
      if (orderedIds.length) {
        await reorderQuizQuestions(quizId, orderedIds);
      }

      // After creation, fetch the full quiz to update state properly
      if (isCreate) {
        const createdQuiz = await fetchQuiz(quizId);
        setQuiz(createdQuiz);
        setInitialQuestionIds(createdQuiz.questions.map(q => q.id));
        initialValues.current = {
          name: createdQuiz.name ?? "",
          description: createdQuiz.description ?? "",
          course: createdQuiz.course,
          module: createdQuiz.module,
          questionIds: createdQuiz.questions.map(q => q.id),
        };
        // Mark as saved BEFORE navigation to prevent blocker
        setHasUnsavedChanges(false);
        // Update URL to edit mode
        navigate(`/quizzes/${quizId}/edit`, { replace: true });
      } else {
        // Update initial values after successful save (edit mode)
        initialValues.current = {
          name,
          description: description ?? "",
          course: selectedCourse,
          module: selectedModule,
          questionIds: orderedIds,
        };
        setInitialQuestionIds(orderedIds);
        // Mark as saved BEFORE navigation to prevent blocker
        setHasUnsavedChanges(false);
        navigate(`/quizzes/${quizId}/edit`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quiz");
    } finally {
      setSaving(false);
      // Reset the saving ref after a small delay to allow navigation to complete
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100);
    }
  };

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Quiz" : "Edit Quiz"}</PageHeaderHeading>
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

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Quiz name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quiz description"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Course</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium">Module</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
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
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: All questions with search and Add */}
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm font-medium">All Questions</div>
            <input
              className="w-1/2 rounded-md border px-3 py-2 text-sm"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeft.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-[360px] truncate">{q.text}</TableCell>
                    <TableCell>{q.topic_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleAdd(q)} disabled={!quiz}>Add</Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/questions/${q.id}/edit`); }}>Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right: Questions in quiz with remove and drag handle */}
        <div className="rounded-md border">
          <div className="border-b p-3 text-sm font-medium">Questions in Quiz</div>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quiz?.questions || []).map((q, idx) => (
                  <TableRow
                    key={q.id}
                    draggable
                    onDragStart={() => onDragStart(q.id)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(q.id)}
                    className="cursor-move"
                  >
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{q.text}</TableCell>
                    <TableCell>{q.topic_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/questions/${q.id}/edit`); }}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleRemove(q); }}>Remove</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-3 text-xs text-muted-foreground">
            Drag rows to change order. Order persistence requires backend support.
          </div>
        </div>
      </div>
    </>
  );
}


