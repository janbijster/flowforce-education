const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface Question {
  id: number;
  text: string;
  organization: number;
  topic: number;
  topic_name: string;
  lesson_name: string;
  module_name: string;
  course_name: string;
  learning_objectives: number[];
  options_count: number;
  learning_objectives_count: number;
  created_at: string;
  updated_at: string;
}

export interface Option {
  id: number;
  text: string;
  is_correct: boolean;
  organization: number;
  question: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionDetail extends Question {
  options: Option[];
}

export async function fetchQuestions(): Promise<Question[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchQuestion(id: number): Promise<QuestionDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch question');
  }
  return await response.json();
}

