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
import { fetchQuestion, QuestionDetail as QuestionDetailType } from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionDetailType | null>(null);
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
          <PageHeaderHeading>Question Detail</PageHeaderHeading>
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
          <PageHeaderHeading>Question Detail</PageHeaderHeading>
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
        <PageHeaderHeading>Question Detail</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/questions/${question.id}/edit`)} variant="outline">
            Edit
          </Button>
          <Button onClick={() => navigate("/questions")} variant="outline">
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-semibold mb-4">Question Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question Text</p>
                <p className="mt-1 whitespace-pre-wrap">{question.text}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Course</p>
                  <p className="mt-1">{question.course_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Module</p>
                  <p className="mt-1">{question.module_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lesson</p>
                  <p className="mt-1">{question.lesson_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Topic</p>
                  <p className="mt-1">{question.topic_name ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="border-b p-3 text-sm font-medium">Options</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option</TableHead>
                  <TableHead className="w-24">Correct</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {question.options && question.options.length > 0 ? (
                  question.options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.text}</TableCell>
                      <TableCell>
                        {option.is_correct ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No options available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <QuestionPreview question={question} showCorrectAnswer={true} />
        </div>
      </div>
    </>
  );
}
