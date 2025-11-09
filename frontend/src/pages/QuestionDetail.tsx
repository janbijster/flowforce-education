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
import { fetchQuestion, QuestionDetail as QuestionDetailType, MultipleChoiceQuestionDetail, OrderQuestionDetail, ConnectQuestionDetail } from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";

export default function QuestionDetail() {
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
          : undefined;
        const data = await fetchQuestion(Number(id), questionType);
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load question");
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
          <Button onClick={() => {
            const typePath = question.question_type === 'multiple_choice' 
              ? 'multiple-choice' 
              : question.question_type === 'order'
              ? 'order'
              : 'connect';
            navigate(`/questions/${typePath}/${question.id}/edit`);
          }} variant="outline">
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
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-muted-foreground">Question Type</p>
                  <QuestionTypeBadge questionType={question.question_type} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question Text</p>
                <p className="mt-1 whitespace-pre-wrap">{question.text}</p>
                {question.image && (
                  <img src={question.image} alt="Question" className="mt-2 max-w-full h-auto rounded" />
                )}
                {question.video && (
                  <video src={question.video} controls className="mt-2 max-w-full rounded" />
                )}
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

          {question.question_type === 'multiple_choice' && (
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
                  {(question as MultipleChoiceQuestionDetail).options && (question as MultipleChoiceQuestionDetail).options.length > 0 ? (
                    (question as MultipleChoiceQuestionDetail).options.map((option) => (
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
          )}
          
          {question.question_type === 'order' && (
            <div className="rounded-md border">
              <div className="border-b p-3 text-sm font-medium">Order Options</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Option</TableHead>
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
                        No options available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {question.question_type === 'connect' && (
            <div className="rounded-md border">
              <div className="border-b p-3 text-sm font-medium">Connect Options & Connections</div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Options:</p>
                  <div className="space-y-2">
                    {(question as ConnectQuestionDetail).connect_options?.map((option) => (
                      <div key={option.id} className="p-2 border rounded">
                        <p className="text-sm">{option.text}</p>
                        <p className="text-xs text-muted-foreground">Position: ({option.position_x.toFixed(2)}, {option.position_y.toFixed(2)})</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Correct Connections:</p>
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
    </>
  );
}
