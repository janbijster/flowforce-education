import { useState, useEffect } from "react";
import { QuestionDetail, MultipleChoiceQuestionDetail, OrderQuestionDetail, ConnectQuestionDetail, NumberQuestionDetail, Option, OrderOption } from "@/lib/api";
import { QuestionTypeBadge } from "./QuestionTypeBadge";
import { ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

interface QuestionPreviewProps {
  question: QuestionDetail | null;
  selectedOption?: number | null; // For single selection (backward compatibility)
  selectedOptions?: number[]; // For multiple selection in multiple choice
  selectedOrder?: number[] | null; // For OrderQuestion: array of option IDs in order
  selectedConnections?: Array<[number, number]> | null; // For ConnectQuestion: array of [from, to] pairs
  selectedNumber?: number | null; // For NumberQuestion: the entered number
  onOptionSelect?: (optionId: number) => void; // For single selection (backward compatibility)
  onOptionsSelect?: (optionIds: number[]) => void; // For multiple selection in multiple choice
  onOrderChange?: (optionIds: number[]) => void;
  onConnectionChange?: (connections: Array<[number, number]>) => void;
  onNumberChange?: (value: number) => void; // For NumberQuestion: callback when number changes
  showCorrectAnswer?: boolean;
  onEditLayout?: () => void; // For Connect questions: callback to open layout editor
}

function MultipleChoicePreview({
  question,
  selectedOption,
  selectedOptions,
  onOptionSelect,
  onOptionsSelect,
  showCorrectAnswer = false,
}: {
  question: MultipleChoiceQuestionDetail;
  selectedOption?: number | null; // For single selection (backward compatibility)
  selectedOptions?: number[]; // For multiple selection
  onOptionSelect?: (optionId: number) => void; // For single selection (backward compatibility)
  onOptionsSelect?: (optionIds: number[]) => void; // For multiple selection
  showCorrectAnswer?: boolean;
}) {
  const getImageUrl = (url: string | null): string | undefined => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
  };

  // Check if question has multiple correct answers
  const correctAnswersCount = question.options.filter(opt => opt.is_correct).length;
  const isMultipleSelect = correctAnswersCount > 1;
  
  // Use multiple selection if available, otherwise fall back to single selection
  const currentSelectedOptions = selectedOptions !== undefined 
    ? selectedOptions 
    : selectedOption !== null && selectedOption !== undefined 
      ? [selectedOption] 
      : [];
  
  const handleOptionToggle = (optionId: number) => {
    if (isMultipleSelect && onOptionsSelect) {
      const newSelection = currentSelectedOptions.includes(optionId)
        ? currentSelectedOptions.filter(id => id !== optionId)
        : [...currentSelectedOptions, optionId];
      onOptionsSelect(newSelection);
    } else if (onOptionSelect) {
      onOptionSelect(optionId);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-base font-medium mb-2">Options:</p>
      {question.options && question.options.length > 0 ? (
        <div className="space-y-2">
          {question.options.map((option: Option) => {
            const isSelected = currentSelectedOptions.includes(option.id);
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
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex items-start gap-2">
                  <input
                    type={isMultipleSelect ? "checkbox" : "radio"}
                    checked={isSelected}
                    onChange={() => handleOptionToggle(option.id)}
                    className="mt-1"
                    readOnly
                  />
                  <div className="flex-1">
                    {option.image && (
                      <img 
                        src={getImageUrl(option.image)} 
                        alt={option.hide_text ? option.text : option.text} 
                        className="mb-2 max-w-full max-h-40 object-contain rounded"
                      />
                    )}
                    {!option.hide_text && (
                      <span className="text-sm">{option.text}</span>
                    )}
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
  );
}

function OrderPreview({
  question,
  selectedOrder,
  onOrderChange,
  showCorrectAnswer = false,
}: {
  question: OrderQuestionDetail;
  selectedOrder?: number[] | null;
  onOrderChange?: (optionIds: number[]) => void;
  showCorrectAnswer?: boolean;
}) {
  const correctOrder = question.order_options
    .sort((a, b) => a.correct_order - b.correct_order)
    .map(opt => opt.id);

  // Use selectedOrder if provided, otherwise use correct order
  const currentOrder = selectedOrder || correctOrder;
  const [dragId, setDragId] = useState<number | null>(null);

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!onOrderChange) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentOrder.length - 1) return;

    const newOrder = [...currentOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    onOrderChange(newOrder);
  };

  const handleDragStart = (optionId: number) => {
    if (showCorrectAnswer) return; // Don't allow dragging when showing answers
    setDragId(optionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (showCorrectAnswer) return;
    e.preventDefault();
  };

  const handleDrop = (targetOptionId: number) => {
    if (showCorrectAnswer || !onOrderChange || dragId === null || dragId === targetOptionId) {
      setDragId(null);
      return;
    }

    const newOrder = [...currentOrder];
    const fromIdx = newOrder.indexOf(dragId);
    const toIdx = newOrder.indexOf(targetOptionId);
    
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      return;
    }

    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    onOrderChange(newOrder);
    setDragId(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-base font-medium mb-2">Order the items correctly:</p>
      {question.order_options && question.order_options.length > 0 ? (
        <div className="space-y-2">
          {currentOrder.map((optionId, index) => {
            const option = question.order_options.find(opt => opt.id === optionId);
            if (!option) return null;
            
            const correctIndex = correctOrder.indexOf(optionId);
            const isCorrectPosition = showCorrectAnswer && index === correctIndex;
            const isIncorrectPosition = showCorrectAnswer && index !== correctIndex;
            const isDragging = dragId === optionId;

            return (
              <div
                key={`${option.id}-${index}`}
                draggable={!showCorrectAnswer && !!onOrderChange}
                onDragStart={() => handleDragStart(option.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(option.id)}
                className={`
                  rounded-md border p-3 transition-colors
                  ${isCorrectPosition ? "bg-green-50 border-green-500" : ""}
                  ${isIncorrectPosition ? "bg-red-50 border-red-500" : "border-gray-200"}
                  ${!showCorrectAnswer && !!onOrderChange ? "cursor-move hover:bg-accent/50" : ""}
                  ${isDragging ? "opacity-50" : ""}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    {option.image && (
                      <img 
                        src={option.image.startsWith('http') ? option.image : `http://127.0.0.1:8000${option.image}`} 
                        alt={option.hide_text ? option.text : option.text} 
                        className="mb-2 max-w-full max-h-40 object-contain rounded"
                      />
                    )}
                    {!option.hide_text && (
                      <span className="text-sm">{option.text}</span>
                    )}
                  </div>
                  {showCorrectAnswer && (
                    <span className="text-xs text-muted-foreground">
                      (Correct: {option.correct_order})
                    </span>
                  )}
                  {!showCorrectAnswer && onOrderChange && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveItem(index, 'up');
                        }}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronUpIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveItem(index, 'down');
                        }}
                        disabled={index === currentOrder.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No options available</p>
      )}
    </div>
  );
}

function NumberPreview({
  question,
  selectedNumber,
  onNumberChange,
  showCorrectAnswer = false,
}: {
  question: NumberQuestionDetail;
  selectedNumber?: number | null;
  onNumberChange?: (value: number) => void;
  showCorrectAnswer?: boolean;
}) {
  const [inputValue, setInputValue] = useState<string>(selectedNumber?.toString() || '');
  
  useEffect(() => {
    if (selectedNumber !== null && selectedNumber !== undefined) {
      setInputValue(selectedNumber.toString());
    } else {
      setInputValue('');
    }
  }, [selectedNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onNumberChange?.(numValue);
    } else if (value === '' || value === '-') {
      onNumberChange?.(0);
    }
  };

  const isCorrect = selectedNumber !== null && selectedNumber !== undefined && !isNaN(selectedNumber) && (() => {
    const diff = Math.abs(selectedNumber - question.correct_answer);
    return diff <= question.tolerance;
  })();

  return (
    <div className="space-y-2">
      <p className="text-base font-medium mb-2">Enter your answer:</p>
      <div className="space-y-2">
        <input
          type="number"
          step="any"
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            showCorrectAnswer 
              ? (isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500")
              : ""
          }`}
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter a number"
          disabled={showCorrectAnswer}
        />
        {showCorrectAnswer && (
          <div className="text-sm">
            {isCorrect ? (
              <span className="text-green-600 font-medium">Correct! The answer is {question.correct_answer}</span>
            ) : (
              <span className="text-red-600 font-medium">
                Incorrect. The correct answer is {question.correct_answer}
                {question.tolerance > 0 && ` (±${question.tolerance})`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectPreview({
  question,
  selectedConnections,
  onConnectionChange,
  showCorrectAnswer = false,
}: {
  question: ConnectQuestionDetail;
  selectedConnections?: Array<[number, number]> | null;
  onConnectionChange?: (connections: Array<[number, number]>) => void;
  showCorrectAnswer?: boolean;
}) {
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  
  const currentConnections = selectedConnections || [];
  const correctConnections = question.correct_connections.map(conn => [conn.from_option, conn.to_option] as [number, number]);

  // Convert normalized position (0-1) to pixel position
  const getPixelPosition = (option: typeof question.connect_options[0]) => ({
    x: option.position_x * CANVAS_WIDTH,
    y: option.position_y * CANVAS_HEIGHT,
  });

  // Get connection line coordinates
  const getConnectionLine = (fromId: number, toId: number) => {
    const fromOption = question.connect_options.find(opt => opt.id === fromId);
    const toOption = question.connect_options.find(opt => opt.id === toId);
    if (!fromOption || !toOption) return null;
    
    const fromPos = getPixelPosition(fromOption);
    const toPos = getPixelPosition(toOption);
    
    return {
      x1: fromPos.x,
      y1: fromPos.y,
      x2: toPos.x,
      y2: toPos.y,
    };
  };

  const handleOptionClick = (optionId: number) => {
    if (showCorrectAnswer || !onConnectionChange) return;
    
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom !== optionId) {
        // Check if connection already exists
        const connectionExists = currentConnections.some(([from, to]) => 
          (from === connectingFrom && to === optionId) || (from === optionId && to === connectingFrom)
        );
        
        if (!connectionExists) {
          onConnectionChange([...currentConnections, [connectingFrom, optionId]]);
        } else {
          // Remove connection if it exists (toggle)
          onConnectionChange(
            currentConnections.filter(([from, to]) => 
              !((from === connectingFrom && to === optionId) || (from === optionId && to === connectingFrom))
            )
          );
        }
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(optionId);
    }
  };

  const handleRemoveConnection = (fromId: number, toId: number) => {
    if (showCorrectAnswer || !onConnectionChange) return;
    onConnectionChange(
      currentConnections.filter(([from, to]) => !(from === fromId && to === toId))
    );
  };

  // Check if a connection is correct
  const isConnectionCorrect = (fromId: number, toId: number) => {
    if (!showCorrectAnswer) return false;
    return correctConnections.some(([from, to]) => 
      (from === fromId && to === toId) || (from === toId && to === fromId)
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium mb-2">Connect the items:</p>
      {question.connect_options && question.connect_options.length > 0 ? (
        <div className="relative bg-muted rounded-md p-4" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {/* SVG overlay for connections */}
          <svg
            className="absolute inset-0"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ pointerEvents: 'none' }}
          >
            {/* Student's connections */}
            {currentConnections.map(([fromId, toId], idx) => {
              const line = getConnectionLine(fromId, toId);
              if (!line) return null;
              const isCorrect = isConnectionCorrect(fromId, toId);
              return (
                <line
                  key={`student-${fromId}-${toId}-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={isCorrect ? "#22c55e" : "#ef4444"}
                  strokeWidth="3"
                  style={{ pointerEvents: 'stroke' }}
                  className="cursor-pointer"
                  onClick={() => handleRemoveConnection(fromId, toId)}
                />
              );
            })}
            
            {/* Correct connections (shown when displaying answers) */}
            {showCorrectAnswer && correctConnections.map(([fromId, toId], idx) => {
              const line = getConnectionLine(fromId, toId);
              if (!line) return null;
              const studentHasConnection = currentConnections.some(([from, to]) => 
                (from === fromId && to === toId) || (from === toId && to === fromId)
              );
              if (studentHasConnection) return null; // Already shown above
              return (
                <line
                  key={`correct-${fromId}-${toId}-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity={0.5}
                />
              );
            })}
            
            {/* Preview connection line when connecting */}
            {connectingFrom && question.connect_options.map(option => {
              if (option.id === connectingFrom) return null;
              const line = getConnectionLine(connectingFrom, option.id);
              if (!line) return null;
              return (
                <line
                  key={`preview-${connectingFrom}-${option.id}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-primary opacity-50"
                />
              );
            })}
          </svg>

          {/* Options as clickable cards */}
          {question.connect_options.map((option) => {
            const pixelPos = getPixelPosition(option);
            const isConnectingFrom = connectingFrom === option.id;
            const hasConnection = currentConnections.some(([from, to]) => from === option.id || to === option.id);
            
            return (
              <div
                key={option.id}
                className={`absolute cursor-pointer rounded-md border p-2 bg-background shadow-sm text-center select-none ${
                  isConnectingFrom ? 'ring-2 ring-primary ring-offset-2' : ''
                } ${hasConnection ? 'border-primary' : ''}`}
                style={{
                  left: `${pixelPos.x}px`,
                  top: `${pixelPos.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${option.width || 100}px`,
                  minWidth: `${option.width || 100}px`,
                }}
                onClick={() => handleOptionClick(option.id)}
              >
                {option.image && (
                  <img
                    src={option.image.startsWith('http') ? option.image : `http://127.0.0.1:8000${option.image}`}
                    alt={option.hide_text ? option.text : (option.text || 'Untitled')}
                    className="mb-1 w-full h-auto rounded object-contain"
                    style={{ maxHeight: `${(option.height || 60) - 40}px` }}
                  />
                )}
                {!option.hide_text && (
                  <div className="text-xs font-medium select-none">{option.text || 'Untitled'}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No options available</p>
      )}
      
      {connectingFrom && !showCorrectAnswer && (
        <div className="rounded-md border border-primary bg-primary/10 p-2">
          <p className="text-sm text-primary">
            Click another option to connect to "{question.connect_options.find(opt => opt.id === connectingFrom)?.text || 'selected option'}"
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setConnectingFrom(null)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export function QuestionPreview({
  question,
  selectedOption,
  selectedOptions,
  selectedOrder,
  selectedConnections,
  selectedNumber,
  onOptionSelect,
  onOptionsSelect,
  onOrderChange,
  onConnectionChange,
  onNumberChange,
  showCorrectAnswer = false,
  onEditLayout,
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
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Preview</h3>
          <QuestionTypeBadge questionType={question.question_type} />
        </div>
        <div className="mb-4">
          <p className="text-base font-medium mb-1">Question:</p>
          {question.image && (
            <img 
              src={question.image.startsWith('http') ? question.image : `http://127.0.0.1:8000${question.image}`} 
              alt={question.hide_text ? question.text : "Question"} 
              className="mb-2 max-w-full max-h-80 object-contain rounded" 
            />
          )}
          {!question.hide_text && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.text}</p>
          )}
          {question.video && (
            <video src={question.video} controls className="mt-2 max-w-full rounded" />
          )}
        </div>
        
        {question.question_type === 'multiple_choice' && (
          <MultipleChoicePreview
            question={question as MultipleChoiceQuestionDetail}
            selectedOption={selectedOption}
            selectedOptions={selectedOptions}
            onOptionSelect={onOptionSelect}
            onOptionsSelect={onOptionsSelect}
            showCorrectAnswer={showCorrectAnswer}
          />
        )}
        
        {question.question_type === 'order' && (
          <OrderPreview
            question={question as OrderQuestionDetail}
            selectedOrder={selectedOrder}
            onOrderChange={onOrderChange}
            showCorrectAnswer={showCorrectAnswer}
          />
        )}
        
        {question.question_type === 'connect' && (
          <>
            {onEditLayout && (
              <div className="mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEditLayout}
                >
                  Edit Layout
                </Button>
              </div>
            )}
            <ConnectPreview
              question={question as ConnectQuestionDetail}
              selectedConnections={selectedConnections}
              onConnectionChange={onConnectionChange}
              showCorrectAnswer={showCorrectAnswer}
            />
          </>
        )}
        
        {question.question_type === 'number' && (
          <NumberPreview
            question={question as NumberQuestionDetail}
            selectedNumber={selectedNumber}
            onNumberChange={onNumberChange}
            showCorrectAnswer={showCorrectAnswer}
          />
        )}
      </div>
    </div>
  );
}
