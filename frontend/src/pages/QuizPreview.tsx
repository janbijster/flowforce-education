import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { fetchQuiz, QuizDetail, fetchQuestion, QuestionDetail } from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";

export default function QuizPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuiz = async () => {
      try {
        const quizData = await fetchQuiz(Number(id));
        setQuiz(quizData);

        // Fetch full details for each question (including options)
        const questionDetails = await Promise.all(
          quizData.questions.map((q) => fetchQuestion(q.id))
        );
        setQuestions(questionDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    if (showAnswers) return; // Don't allow selection when showing answers
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Quiz Preview</PageHeaderHeading>
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
          <PageHeaderHeading>Quiz Preview</PageHeaderHeading>
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
        <PageHeaderHeading>Quiz Preview: {quiz.name}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/quizzes/${quiz.id}`)}>
            Back to Quiz Detail
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {quiz.description && (
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">{quiz.description}</p>
          </div>
        )}

        <div className="space-y-6">
          {questions.length > 0 ? (
            questions.map((question, index) => (
              <div key={question.id} className="rounded-md border p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      Question {index + 1} of {questions.length}
                    </h3>
                    {quiz.course_name && (
                      <span className="text-sm text-muted-foreground">
                        {quiz.course_name}
                        {quiz.module_name && ` • ${quiz.module_name}`}
                      </span>
                    )}
                  </div>
                </div>
                <QuestionPreview
                  question={question}
                  selectedOption={selectedOptions[question.id] || null}
                  onOptionSelect={(optionId) => handleOptionSelect(question.id, optionId)}
                  showCorrectAnswer={showAnswers}
                />
              </div>
            ))
          ) : (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No questions in this quiz
            </div>
          )}
        </div>
      </div>
    </>
  );
}

