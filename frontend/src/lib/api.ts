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

export interface Quiz {
  id: number;
  name: string;
  description: string | null;
  organization: number;
  course: number | null;
  module: number | null;
  lessons: number[];
  topics: number[];
  course_name: string | null;
  module_name: string | null;
  questions_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuizDetail extends Quiz {
  questions: Question[];
}

export interface Course {
  id: number;
  name: string;
  description: string | null;
  organization: number;
  modules_count: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  name: string;
  description: string | null;
  organization: number;
  course: number;
  course_name: string;
  lessons_count: number;
  created_at: string;
  updated_at: string;
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
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

export async function fetchQuizzes(): Promise<Quiz[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/quizzes/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quizzes');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchQuiz(id: number): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/quizzes/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quiz');
  }
  return await response.json();
}

export async function searchQuestions(params: { search?: string; quiz?: number; topic?: number }): Promise<Question[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (typeof params.quiz === 'number') qs.set('quiz', String(params.quiz));
  if (typeof params.topic === 'number') qs.set('topic', String(params.topic));
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/?${qs.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to search questions');
  }
  const data = await response.json();
  return data.results || data;
}

export async function assignQuestionToQuiz(questionId: number, quizId: number | null): Promise<Question> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/${questionId}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify({ quiz: quizId }),
  });
  if (!response.ok) {
    throw new Error('Failed to update question');
  }
  return await response.json();
}

export async function createQuiz(payload: Partial<Quiz>): Promise<Quiz> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/quizzes/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create quiz');
  }
  return await response.json();
}

export async function updateQuiz(id: number, payload: Partial<Quiz>): Promise<Quiz> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/quizzes/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update quiz');
  }
  return await response.json();
}

export async function reorderQuizQuestions(quizId: number, orderedIds: number[]): Promise<{ updated: number }> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/quizzes/${quizId}/reorder/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (!response.ok) {
    throw new Error('Failed to reorder questions');
  }
  return await response.json();
}

export async function fetchCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses/courses/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchModules(courseId?: number): Promise<Module[]> {
  const qs = new URLSearchParams();
  if (courseId) qs.set('course', String(courseId));
  const response = await fetch(`${API_BASE_URL}/courses/modules/?${qs.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch modules');
  }
  const data = await response.json();
  return data.results || data;
}

export async function createQuestion(payload: Partial<Question>): Promise<Question> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create question');
  }
  return await response.json();
}

export async function updateQuestion(id: number, payload: Partial<Question>): Promise<Question> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/questions/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update question');
  }
  return await response.json();
}

export async function createOption(payload: Partial<Option>): Promise<Option> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/options/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create option');
  }
  return await response.json();
}

export async function updateOption(id: number, payload: Partial<Option>): Promise<Option> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/options/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update option');
  }
  return await response.json();
}

export async function deleteOption(id: number): Promise<void> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/options/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete option');
  }
}

