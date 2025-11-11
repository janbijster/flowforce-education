import { Question } from "@/lib/api";

interface QuestionTypeBadgeProps {
  questionType: Question['question_type'];
  className?: string;
}

export function QuestionTypeBadge({ questionType, className = "" }: QuestionTypeBadgeProps) {
  const typeLabels = {
    multiple_choice: 'MC',
    order: 'Order',
    connect: 'Connect',
    number: 'Number',
  };
  
  const typeColors = {
    multiple_choice: 'bg-blue-100 text-blue-700',
    order: 'bg-purple-100 text-purple-700',
    connect: 'bg-green-100 text-green-700',
    number: 'bg-orange-100 text-orange-700',
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[questionType]} ${className}`}>
      {typeLabels[questionType]}
    </span>
  );
}

