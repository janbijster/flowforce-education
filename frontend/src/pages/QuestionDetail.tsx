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
import { fetchQuestion, QuestionDetail as QuestionDetailType, MultipleChoiceQuestionDetail, OrderQuestionDetail, ConnectQuestionDetail, NumberQuestionDetail } from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";

export default function QuestionDetail() {
  const { t } = useTranslation();
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuestion = async () => {
      try {
        // Convert URL type path to question type
        const questionType = type === 'multiple-choice' 
          ? 'multiple_choice' as const
          : type === 'order' 
          ? 'order' as const
          : type === 'connect'
          ? 'connect' as const
          : type === 'number'
          ? 'number' as const
          : undefined;
        const data = await fetchQuestion(Number(id), questionType);
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("questions.failedToLoadQuestion"));
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [id, type]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{t("questions.questionDetail")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
          <p className="text-destructive">{error || t("questions.questionNotFound")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t("questions.questionDetail")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => {
            const typePath = question.question_type === 'multiple_choice' 
              ? 'multiple-choice' 
              : question.question_type === 'order'
              ? 'order'
              : question.question_type === 'connect'
              ? 'connect'
              : 'number';
            navigate(`/questions/${typePath}/${question.id}/edit`);
          }} variant="outline">
            {t("common.edit")}
          </Button>
          <Button onClick={() => navigate("/questions")} variant="outline">
            {t("common.back")}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-semibold mb-4">{t("questions.questionInformation")}</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-muted-foreground">{t("questions.questionType")}</p>
                  <QuestionTypeBadge questionType={question.question_type} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("questions.questionText")}</p>
                {!question.hide_text && (
                  <p className="mt-1 whitespace-pre-wrap">{question.text}</p>
                )}
                {question.image && (
                  <img src={question.image} alt={question.hide_text ? question.text : "Question"} className="mt-2 max-w-full h-auto rounded" />
                )}
                {question.video && (
                  <video src={question.video} controls className="mt-2 max-w-full rounded" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("quizzes.course")}</p>
                  <p className="mt-1">{question.course_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("quizzes.module")}</p>
                  <p className="mt-1">{question.module_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("quizzes.lesson")}</p>
                  <p className="mt-1">{question.lesson_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("quizzes.topic")}</p>
                  <p className="mt-1">{question.topic_name ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {question.question_type === 'multiple_choice' && (
            <div className="rounded-md border">
              <div className="border-b p-3 text-sm font-medium">{t("questions.options")}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("questions.options")}</TableHead>
                    <TableHead className="w-24">{t("questions.correct")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(question as MultipleChoiceQuestionDetail).options && (question as MultipleChoiceQuestionDetail).options.length > 0 ? (
                    (question as MultipleChoiceQuestionDetail).options.map((option) => (
                      <TableRow key={option.id}>
                        <TableCell>{option.text}</TableCell>
                        <TableCell>
                          {option.is_correct ? (
                            <span className="text-green-600 font-medium">{t("common.all")}</span>
                          ) : (
                            <span className="text-muted-foreground">{t("common.none")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {t("questions.noOptionsAvailable")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {question.question_type === 'order' && (
            <div className="rounded-md border">
              <div className="border-b p-3 text-sm font-medium">{t("questions.orderOptionsTitle")}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.order")}</TableHead>
                    <TableHead>{t("questions.options")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(question as OrderQuestionDetail).order_options && (question as OrderQuestionDetail).order_options.length > 0 ? (
                    (question as OrderQuestionDetail).order_options
                      .sort((a, b) => a.correct_order - b.correct_order)
                      .map((option) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-medium">{option.correct_order}</TableCell>
                          <TableCell>{option.text}</TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {t("questions.noOptionsAvailable")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {question.question_type === 'connect' && (
            <div className="rounded-md border">
              <div className="border-b p-3 text-sm font-medium">{t("questions.connectOptionsConnections")}</div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{t("questions.options")}:</p>
                  <div className="space-y-2">
                    {(question as ConnectQuestionDetail).connect_options?.map((option) => (
                      <div key={option.id} className="p-2 border rounded">
                        <p className="text-sm">{option.text}</p>
                        <p className="text-xs text-muted-foreground">{t("questions.position")}: ({option.position_x.toFixed(2)}, {option.position_y.toFixed(2)})</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t("questions.correctConnections")}</p>
                  <ul className="space-y-1">
                    {(question as ConnectQuestionDetail).correct_connections?.map((conn) => (
                      <li key={conn.id} className="text-sm">
                        {conn.from_option_text} → {conn.to_option_text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <QuestionPreview question={question} showCorrectAnswer={true} />
        </div>
      </div>
      
      {question.question_type === 'number' && (
        <div className="mt-6 rounded-md border p-4">
          <h2 className="text-lg font-semibold mb-4">{t("questions.answerInformation")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("questions.correctAnswer")}</p>
              <p className="mt-1 text-lg font-semibold">{(question as NumberQuestionDetail).correct_answer}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("questions.toleranceLabel")}</p>
              <p className="mt-1">{(question as NumberQuestionDetail).tolerance}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
