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
import { fetchQuestion, QuestionDetail } from "@/lib/api";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuestion = async () => {
      try {
        const data = await fetchQuestion(Number(id));
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load question");
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
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

  if (error || !question) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quiz Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Question not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Quiz Detail</PageHeaderHeading>
        <Button onClick={() => navigate("/quizzes")} variant="outline">
          Back to Quizzes
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-semibold mb-2">Question</h2>
          <p className="text-muted-foreground">{question.text}</p>
        </div>

        <div className="rounded-md border p-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Course:</span> {question.course_name}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Module:</span> {question.module_name}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Lesson:</span> {question.lesson_name}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Topic:</span> {question.topic_name}
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Correct Answer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {question.options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>{option.text}</TableCell>
                  <TableCell>
                    {option.is_correct ? (
                      <span className="text-green-600 font-semibold">✓ Correct</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

