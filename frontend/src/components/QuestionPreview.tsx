import { QuestionDetail, Option } from "@/lib/api";

interface QuestionPreviewProps {
  question: QuestionDetail | null;
  selectedOption?: number | null;
  onOptionSelect?: (optionId: number) => void;
  showCorrectAnswer?: boolean;
}

export function QuestionPreview({
  question,
  selectedOption,
  onOptionSelect,
  showCorrectAnswer = false,
}: QuestionPreviewProps) {
  if (!question) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        No question selected
      </div>
    );
  }

  return (
    <div className="rounded-md border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <div className="mb-4">
          <p className="text-base font-medium mb-1">Question:</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.text}</p>
        </div>
        <div className="space-y-2">
          <p className="text-base font-medium mb-2">Options:</p>
          {question.options && question.options.length > 0 ? (
            <div className="space-y-2">
              {question.options.map((option: Option) => {
                const isSelected = selectedOption === option.id;
                const isCorrect = option.is_correct;
                const showAsCorrect = showCorrectAnswer && isCorrect;
                const showAsIncorrect = showCorrectAnswer && isSelected && !isCorrect;

                return (
                  <div
                    key={option.id}
                    className={`
                      rounded-md border p-3 cursor-pointer transition-colors
                      ${isSelected ? "bg-accent border-primary" : "hover:bg-accent/50"}
                      ${showAsCorrect ? "bg-green-50 border-green-500" : ""}
                      ${showAsIncorrect ? "bg-red-50 border-red-500" : ""}
                    `}
                    onClick={() => onOptionSelect?.(option.id)}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => onOptionSelect?.(option.id)}
                        className="mt-1"
                        readOnly
                      />
                      <div className="flex-1">
                        <span className="text-sm">{option.text}</span>
                        {showCorrectAnswer && isCorrect && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                        )}
                        {showCorrectAnswer && isSelected && !isCorrect && (
                          <span className="ml-2 text-xs text-red-600 font-medium">(Incorrect)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No options available</p>
          )}
        </div>
      </div>
    </div>
  );
}
