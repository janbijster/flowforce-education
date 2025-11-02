import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Quiz,
  QuizDetail,
  Question,
  fetchQuiz,
  createQuiz,
  updateQuiz,
  searchQuestions,
  assignQuestionToQuiz,
  reorderQuizQuestions,
} from "@/lib/api";

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === "new" || !id;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [initialQuestionIds, setInitialQuestionIds] = useState<number[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        if (!isCreate && id) {
          const q = await fetchQuiz(Number(id));
          setQuiz(q);
          setInitialQuestionIds(q.questions.map(q => q.id));
          setName(q.name ?? "");
          setDescription(q.description ?? "");
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
        }
        const qs = await searchQuestions({ search: "" });
        setAllQuestions(qs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load quiz data");
      }
    };
    init();
  }, [id, isCreate]);

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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let quizId = quiz?.id ?? 0;
      if (isCreate) {
        const created: Quiz = await createQuiz({ name, description: description || null });
        quizId = created.id;
      } else if (quiz) {
        await updateQuiz(quiz.id, { name, description: description || null });
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

      navigate(`/quizzes/${quizId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Quiz" : "Edit Quiz"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/quizzes")}>Back</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </PageHeader>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Quiz name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
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
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeft.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-[360px] truncate">{q.text}</TableCell>
                    <TableCell>{q.topic_name}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleAdd(q)} disabled={!quiz}>Add</Button>
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
                  <TableHead className="w-24">Action</TableHead>
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
                      <Button size="sm" variant="outline" onClick={() => handleRemove(q)}>Remove</Button>
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


