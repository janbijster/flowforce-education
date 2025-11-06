import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { fetchQuiz, QuizDetail as QuizDetailType } from "@/lib/api";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuiz = async () => {
      try {
        const data = await fetchQuiz(Number(id));
        setQuiz(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quiz Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !quiz) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quiz Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Quiz not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Quiz Detail</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/quizzes/${quiz.id}/preview`)} variant="outline">
            Preview
          </Button>
          <Button onClick={() => navigate(`/quizzes/${quiz.id}/edit`)} variant="outline">
            Edit
          </Button>
          <Button onClick={() => navigate("/quizzes")} variant="outline">
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-semibold mb-1">{quiz.name}</h2>
          {quiz.description ? (
            <p className="text-muted-foreground">{quiz.description}</p>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Course:</span> {quiz.course_name ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Module:</span> {quiz.module_name ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Questions:</span> {quiz.questions_count}
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quiz.questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-[480px] truncate">{q.text}</TableCell>
                  <TableCell>{q.topic_name}</TableCell>
                  <TableCell>{q.lesson_name}</TableCell>
                  <TableCell>{q.module_name}</TableCell>
                  <TableCell>{q.options_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

