import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { fetchQuiz, QuizDetail, fetchQuestion, QuestionDetail, combineQuestions, OrderQuestionDetail } from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function QuizPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  // Use composite keys (question_type:id) since IDs can overlap across question types
  // For multiple choice: support both single (number | null) and multiple (number[]) for backward compatibility
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null | number[]>>({});
  const [selectedOrders, setSelectedOrders] = useState<Record<string, number[]>>({});
  const [selectedConnections, setSelectedConnections] = useState<Record<string, Array<[number, number]>>>({});
  const [selectedNumbers, setSelectedNumbers] = useState<Record<string, number | null>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuiz = async () => {
      try {
        const quizData = await fetchQuiz(Number(id));
        setQuiz(quizData);

        // Combine all question types and fetch full details
        const allQuestions = quizData.questions || combineQuestions(quizData);
        const questionDetails = await Promise.all(
          allQuestions.map((q) => fetchQuestion(q.id, q.question_type))
        );
        setQuestions(questionDetails);

        // Initialize randomized order for Order questions
        const initialOrders: Record<string, number[]> = {};
        questionDetails.forEach((q) => {
          if (q.question_type === 'order') {
            const orderQuestion = q as OrderQuestionDetail;
            const optionIds = orderQuestion.order_options.map(opt => opt.id);
            // Randomize the order for the student
            const key = `${q.question_type}:${q.id}`;
            initialOrders[key] = shuffleArray(optionIds);
          }
        });
        setSelectedOrders(initialOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id]);

  const handleOptionSelect = (question: QuestionDetail, optionId: number) => {
    if (showAnswers) return;
    const key = `${question.question_type}:${question.id}`;
    // For single selection (backward compatibility)
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: optionId,
    }));
  };

  const handleOptionsSelect = (question: QuestionDetail, optionIds: number[]) => {
    if (showAnswers) return;
    const key = `${question.question_type}:${question.id}`;
    // For multiple selection
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: optionIds,
    }));
  };

  const handleOrderChange = (question: QuestionDetail, optionIds: number[]) => {
    if (showAnswers) return;
    const key = `${question.question_type}:${question.id}`;
    setSelectedOrders((prev) => ({
      ...prev,
      [key]: optionIds,
    }));
  };

  const handleConnectionChange = (question: QuestionDetail, connections: Array<[number, number]>) => {
    if (showAnswers) return;
    const key = `${question.question_type}:${question.id}`;
    setSelectedConnections((prev) => ({
      ...prev,
      [key]: connections,
    }));
  };

  const handleNumberChange = (question: QuestionDetail, value: number) => {
    if (showAnswers) return;
    const key = `${question.question_type}:${question.id}`;
    setSelectedNumbers((prev) => ({
      ...prev,
      [key]: value,
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
              <div key={`${question.question_type}:${question.id}`} className="rounded-md border p-6">
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
                  selectedOption={(() => {
                    const selection = selectedOptions[`${question.question_type}:${question.id}`];
                    // If it's an array, return null for selectedOption (use selectedOptions instead)
                    if (Array.isArray(selection)) return null;
                    return selection || null;
                  })()}
                  selectedOptions={(() => {
                    const selection = selectedOptions[`${question.question_type}:${question.id}`];
                    // If it's an array, return it; otherwise return undefined
                    return Array.isArray(selection) ? selection : undefined;
                  })()}
                  selectedOrder={selectedOrders[`${question.question_type}:${question.id}`] || null}
                  selectedConnections={selectedConnections[`${question.question_type}:${question.id}`] || null}
                  selectedNumber={selectedNumbers[`${question.question_type}:${question.id}`] || null}
                  onOptionSelect={(optionId) => handleOptionSelect(question, optionId)}
                  onOptionsSelect={(optionIds) => handleOptionsSelect(question, optionIds)}
                  onOrderChange={(optionIds) => handleOrderChange(question, optionIds)}
                  onConnectionChange={(connections) => handleConnectionChange(question, connections)}
                  onNumberChange={(value) => handleNumberChange(question, value)}
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

