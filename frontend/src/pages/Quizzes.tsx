import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { LoadingError } from "@/components/LoadingError";
import { fetchQuizzes, Quiz } from "@/lib/api";

export default function Quizzes() {
  const { t } = useTranslation();
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
        setError(err instanceof Error ? err.message : t("errors.failedToLoadQuizzes"));
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const handleRowClick = (id: number) => {
    navigate(`/quizzes/${id}`);
  };

  return (
    <LoadingError loading={loading} error={error} title={t("quizzes.quizzes")}>
      <PageHeader>
        <PageHeaderHeading>{t("quizzes.quizzes")}</PageHeaderHeading>
        <Button onClick={() => navigate("/quizzes/new")}>{t("quizzes.newQuiz")}</Button>
      </PageHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("quizzes.course")}</TableHead>
              <TableHead>{t("quizzes.module")}</TableHead>
              <TableHead>{t("quizzes.questions")}</TableHead>
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
    </LoadingError>
  );
}
