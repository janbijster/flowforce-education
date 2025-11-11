import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { fetchQuizzes, Quiz } from "@/lib/api";

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await fetchQuizzes();
        setQuizzes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const handleRowClick = (id: number) => {
    navigate(`/quizzes/${id}`);
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quizzes</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quizzes</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Quizzes</PageHeaderHeading>
        <Button onClick={() => navigate("/quizzes/new")}>New Quiz</Button>
      </PageHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Questions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow
                key={`quiz-${quiz.id}-${quiz.organization}`}
                onClick={() => handleRowClick(quiz.id)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{quiz.name}</TableCell>
                <TableCell>{quiz.course_name}</TableCell>
                <TableCell>{quiz.module_name}</TableCell>
                <TableCell>{quiz.questions_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

