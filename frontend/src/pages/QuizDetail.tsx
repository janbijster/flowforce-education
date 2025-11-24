import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { fetchQuiz, QuizDetail as QuizDetailType, combineQuestions, Question } from "@/lib/api";

export default function QuizDetail() {
  const { t } = useTranslation();
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
          <PageHeaderHeading>{t("quizzes.quizDetail")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
          <p className="text-destructive">{error || t("quizzes.quizNotFound")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t("quizzes.quizDetail")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/quizzes/${quiz.id}/preview`)} variant="outline">
            {t("quizzes.preview")}
          </Button>
          <Button onClick={() => navigate(`/quizzes/${quiz.id}/edit`)} variant="outline">
            {t("common.edit")}
          </Button>
          <Button onClick={() => navigate("/quizzes")} variant="outline">
            {t("common.back")}
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
              <span className="font-medium">{t("quizzes.course")}:</span> {quiz.course_name ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{t("quizzes.module")}:</span> {quiz.module_name ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{t("quizzes.questions")}:</span> {quiz.questions_count}
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("questions.question")}</TableHead>
                <TableHead>{t("quizzes.topic")}</TableHead>
                <TableHead>{t("quizzes.lesson")}</TableHead>
                <TableHead>{t("quizzes.module")}</TableHead>
                <TableHead>{t("questions.options")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Combine all question types into a unified list
                const allQuestions = quiz.questions || combineQuestions(quiz);
                return allQuestions.map((q: Question) => (
                  <TableRow key={`${q.question_type}:${q.id}`}>
                    <TableCell className="max-w-[480px] truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {q.question_type === 'multiple_choice' ? 'MC' : q.question_type === 'order' ? 'Order' : q.question_type === 'connect' ? 'Connect' : 'Number'}
                        </span>
                        <span>{q.text}</span>
                      </div>
                    </TableCell>
                    <TableCell>{q.topic_name}</TableCell>
                    <TableCell>{q.lesson_name}</TableCell>
                    <TableCell>{q.module_name}</TableCell>
                    <TableCell>
                      {q.question_type === 'multiple_choice' 
                        ? (q as any).options_count || 0
                        : q.question_type === 'order'
                        ? (q as any).order_options_count || 0
                        : q.question_type === 'connect'
                        ? (q as any).connect_options_count || 0
                        : 0}
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

