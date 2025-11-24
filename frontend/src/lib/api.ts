const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Base question interface with common fields
export interface BaseQuestion {
  id: number;
  text: string;
  order: number;
  question_type: 'multiple_choice' | 'order' | 'connect' | 'number';
  image: string | null;
  video: string | null;
  hide_text: boolean;
  organization: number;
  quiz: number | null;
  topic: number;
  topic_name: string;
  lesson_name: string;
  module_name: string;
  course_name: string;
  quiz_name: string | null;
  created_at: string;
  updated_at: string;
}

// Multiple Choice Question
export interface MultipleChoiceQuestion extends BaseQuestion {
  question_type: 'multiple_choice';
  options_count: number;
}

export interface MultipleChoiceQuestionDetail extends MultipleChoiceQuestion {
  options: Option[];
}

// Order Question
export interface OrderQuestion extends BaseQuestion {
  question_type: 'order';
  order_options_count: number;
}

export interface OrderQuestionDetail extends OrderQuestion {
  order_options: OrderOption[];
}

// Connect Question
export interface ConnectQuestion extends BaseQuestion {
  question_type: 'connect';
  connect_options_count: number;
  connections_count: number;
}

export interface ConnectQuestionDetail extends ConnectQuestion {
  connect_options: ConnectOption[];
  correct_connections: ConnectOptionConnection[];
}

// Number Question
export interface NumberQuestion extends BaseQuestion {
  question_type: 'number';
  correct_answer: number;
  tolerance: number;
}

export interface NumberQuestionDetail extends NumberQuestion {
  // No additional fields, same as base
}

// Union type for all question types
export type Question = MultipleChoiceQuestion | OrderQuestion | ConnectQuestion | NumberQuestion;
export type QuestionDetail = MultipleChoiceQuestionDetail | OrderQuestionDetail | ConnectQuestionDetail | NumberQuestionDetail;

// Options for different question types
export interface Option {
  id: number;
  text: string;
  is_correct: boolean;
  image: string | null;
  hide_text: boolean;
  organization: number;
  question: number;
  created_at: string;
  updated_at: string;
}

export interface OrderOption {
  id: number;
  text: string;
  image: string | null;
  hide_text: boolean;
  correct_order: number;
  organization: number;
  question: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectOption {
  id: number;
  text: string;
  image: string | null;
  connectable: boolean;
  hide_text: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  organization: number;
  question: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectOptionConnection {
  id: number;
  question: number;
  from_option: number;
  to_option: number;
  from_option_text: string;
  to_option_text: string;
  organization: number;
  created_at: string;
  updated_at: string;
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
  multiple_choice_questions: MultipleChoiceQuestion[];
  order_questions: OrderQuestion[];
  connect_questions: ConnectQuestion[];
  number_questions: NumberQuestion[];
  // Helper: get all questions as a unified list
  questions?: Question[]; // Computed property, not from API
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

export interface Lesson {
  id: number;
  name: string;
  description: string | null;
  organization: number;
  module: number;
  module_name: string;
  course_name: string;
  topics_count: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  name: string;
  description: string | null;
  organization: number;
  lesson: number;
  lesson_name: string;
  module_name: string;
  course_name: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  title: string;
  description: string | null;
  order: number;
  material_type: 'reader' | 'presentation';
  organization: number;
  course: number | null;
  modules: number[];
  lessons: number[];
  topics: number[];
  course_name: string | null;
  modules_names: string[];
  lessons_names: string[];
  topics_names: string[];
  file: string | null;
  file_url: string | null;
  content: string | null;
  slide_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialDetail extends Material {
  // Same as base for now, but can be extended if needed
}

export interface StudentGroup {
  id: number;
  name: string;
  organization: number;
  course: number;
  modules: number[];
  year: number;
  course_name: string;
  modules_names: string[];
  students_count: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  mastered_topics: number;
  total_topics: number;
  percentage: number;
}

export interface StudentGroupDetail extends StudentGroup {
  students: StudentWithProgress[];
}

export interface Student {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  organization: number;
  student_groups: number[];
  student_groups_names: string[];
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface StudentWithProgress extends Student {
  progress?: StudentProgress;
}

export interface StudentGroupWithProgress {
  id: number;
  name: string;
  course_name: string;
  year: number;
  progress: StudentProgress;
}

export interface StudentDetail extends Student {
  question_answers_count: number;
  student_groups_with_progress: StudentGroupWithProgress[];
}

export interface TopicProgress {
  id: number;
  name: string;
  description: string;
  lesson_name: string;
  module_name: string;
  course_name: string;
  questions_answered: number;
  questions_correct: number;
  total_questions: number;
  percentage: number;
}

export interface StudentQuestionAnswer {
  id: number;
  student: number;
  question: number;
  quiz: number;
  answer: number;
  student_name: string;
  question_text: string;
  quiz_name: string;
  answer_text: string;
  correct: boolean;
  organization: number;
  created_at: string;
  updated_at: string;
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper function to combine all question types into a unified list
export function combineQuestions(quiz: QuizDetail): Question[] {
  const questions: Question[] = [
    ...(quiz.multiple_choice_questions || []),
    ...(quiz.order_questions || []),
    ...(quiz.connect_questions || []),
    ...(quiz.number_questions || []),
  ];
  // Sort by order
  return questions.sort((a, b) => a.order - b.order);
}

export async function fetchQuestions(): Promise<Question[]> {
  // Fetch all question types and combine them
  // Use Promise.allSettled to handle partial failures gracefully
  const results = await Promise.allSettled([
    fetch(`${API_BASE_URL}/quizzes/multiple-choice-questions/`, { credentials: 'include' }),
    fetch(`${API_BASE_URL}/quizzes/order-questions/`, { credentials: 'include' }),
    fetch(`${API_BASE_URL}/quizzes/connect-questions/`, { credentials: 'include' }),
    fetch(`${API_BASE_URL}/quizzes/number-questions/`, { credentials: 'include' }),
  ]);
  
  const allQuestions: Question[] = [];
  
  // Process each result, handling failures gracefully
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.ok) {
      try {
        const data = await result.value.json();
        const questions = data.results || data;
        allQuestions.push(...questions);
      } catch (e) {
        // Log error but continue with other question types
        console.warn('Failed to parse question data:', e);
      }
    } else if (result.status === 'rejected') {
      console.warn('Failed to fetch questions from one endpoint:', result.reason);
    } else if (result.status === 'fulfilled' && !result.value.ok) {
      console.warn('Question endpoint returned error:', result.value.status, result.value.statusText);
    }
  }
  
  return allQuestions;
}

export async function fetchQuestion(id: number, questionType?: 'multiple_choice' | 'order' | 'connect' | 'number'): Promise<QuestionDetail> {
  // If question type is provided, use the specific endpoint for better performance
  if (questionType) {
    let endpoint = `${API_BASE_URL}/quizzes/multiple-choice-questions/${id}/`;
    if (questionType === 'order') {
      endpoint = `${API_BASE_URL}/quizzes/order-questions/${id}/`;
    } else if (questionType === 'connect') {
      endpoint = `${API_BASE_URL}/quizzes/connect-questions/${id}/`;
    } else if (questionType === 'number') {
      endpoint = `${API_BASE_URL}/quizzes/number-questions/${id}/`;
    }
    
    const response = await fetch(endpoint, { credentials: 'include' });
    if (response.ok) {
      const question = await response.json();
      if (question.id === id) {
        return question;
      }
    }
    throw new Error(`Failed to fetch ${questionType} question with ID ${id}`);
  }
  
  // If type is not provided, try all endpoints until we find one that matches the ID
  // Since different question types can have overlapping IDs, we need to check all
  // and return the one where the ID actually matches
  
  const endpoints = [
    `${API_BASE_URL}/quizzes/multiple-choice-questions/${id}/`,
    `${API_BASE_URL}/quizzes/order-questions/${id}/`,
    `${API_BASE_URL}/quizzes/connect-questions/${id}/`,
    `${API_BASE_URL}/quizzes/number-questions/${id}/`,
  ];
  
  // Try all endpoints in parallel for better performance
  const responses = await Promise.allSettled(
    endpoints.map(endpoint => 
      fetch(endpoint, { credentials: 'include' })
    )
  );
  
  // Find the first successful response where the ID matches
  for (let i = 0; i < responses.length; i++) {
    const result = responses[i];
    if (result.status === 'fulfilled' && result.value.ok) {
      try {
        const question = await result.value.json();
        // Verify the ID matches (in case of redirects or errors)
        if (question.id === id) {
          return question;
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }
  }
  
  throw new Error(`Failed to fetch question with ID ${id}`);
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
  const quiz: QuizDetail = await response.json();
  // Combine all question types into a unified list for backward compatibility
  quiz.questions = combineQuestions(quiz);
  return quiz;
}

export async function searchQuestions(params: { search?: string; quiz?: number; topic?: number; question_type?: 'multiple_choice' | 'order' | 'connect' | 'number' }): Promise<Question[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (typeof params.quiz === 'number') qs.set('quiz', String(params.quiz));
  if (typeof params.topic === 'number') qs.set('topic', String(params.topic));
  
  // Search across all question types if no specific type is requested
  if (params.question_type) {
    const endpoint = params.question_type === 'multiple_choice' 
      ? 'multiple-choice-questions'
      : params.question_type === 'order'
      ? 'order-questions'
      : params.question_type === 'connect'
      ? 'connect-questions'
      : 'number-questions';
    const response = await fetch(`${API_BASE_URL}/quizzes/${endpoint}/?${qs.toString()}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to search questions');
    }
    const data = await response.json();
    return data.results || data;
  } else {
    // Search all types and combine
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      fetch(`${API_BASE_URL}/quizzes/multiple-choice-questions/?${qs.toString()}`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/quizzes/order-questions/?${qs.toString()}`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/quizzes/connect-questions/?${qs.toString()}`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/quizzes/number-questions/?${qs.toString()}`, { credentials: 'include' }),
    ]);
    
    const allQuestions: Question[] = [];
    
    // Process each result, handling failures gracefully
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ok) {
        try {
          const data = await result.value.json();
          const questions = data.results || data;
          allQuestions.push(...questions);
        } catch (e) {
          // Log error but continue with other question types
          console.warn('Failed to parse question data:', e);
        }
      } else if (result.status === 'rejected') {
        console.warn('Failed to fetch questions from one endpoint:', result.reason);
      } else if (result.status === 'fulfilled' && !result.value.ok) {
        console.warn('Question endpoint returned error:', result.value.status, result.value.statusText);
      }
    }
    
    return allQuestions;
  }
}

export async function assignQuestionToQuiz(questionId: number, quizId: number | null, questionType?: 'multiple_choice' | 'order' | 'connect' | 'number'): Promise<Question> {
  const csrftoken = getCsrfToken();
  
  // Determine endpoint based on question type
  let endpoint = `${API_BASE_URL}/quizzes/questions/`; // Default to backward compatibility
  if (questionType === 'order') {
    endpoint = `${API_BASE_URL}/quizzes/order-questions/`;
  } else if (questionType === 'connect') {
    endpoint = `${API_BASE_URL}/quizzes/connect-questions/`;
  } else if (questionType === 'number') {
    endpoint = `${API_BASE_URL}/quizzes/number-questions/`;
  } else if (questionType === 'multiple_choice') {
    endpoint = `${API_BASE_URL}/quizzes/multiple-choice-questions/`;
  }
  
  const response = await fetch(`${endpoint}${questionId}/`, {
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
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/courses/modules/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch modules');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchLessons(moduleId?: number): Promise<Lesson[]> {
  const qs = new URLSearchParams();
  if (moduleId) qs.set('module', String(moduleId));
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/courses/lessons/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch lessons');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchTopics(lessonId?: number): Promise<Topic[]> {
  const qs = new URLSearchParams();
  if (lessonId) qs.set('lesson', String(lessonId));
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/courses/topics/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  const data = await response.json();
  return data.results || data;
}

// Material API functions
export async function fetchMaterials(params?: {
  course?: number;
  modules?: number[];
  lessons?: number[];
  topics?: number[];
  material_type?: 'reader' | 'presentation';
}): Promise<Material[]> {
  const qs = new URLSearchParams();
  if (params?.course) qs.set('course', String(params.course));
  if (params?.modules && params.modules.length > 0) {
    params.modules.forEach(m => qs.append('modules', String(m)));
  }
  if (params?.lessons && params.lessons.length > 0) {
    params.lessons.forEach(l => qs.append('lessons', String(l)));
  }
  if (params?.topics && params.topics.length > 0) {
    params.topics.forEach(t => qs.append('topics', String(t)));
  }
  if (params?.material_type) qs.set('material_type', params.material_type);
  
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/courses/materials/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch materials');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchMaterial(id: number): Promise<MaterialDetail> {
  const response = await fetch(`${API_BASE_URL}/courses/materials/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch material');
  }
  return await response.json();
}

export async function createMaterial(payload: Partial<Material> & { file?: File }): Promise<Material> {
  const csrftoken = getCsrfToken();
  const { file, ...jsonPayload } = payload;
  
  if (file) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // For ManyToMany fields, append each item separately
          value.forEach(item => formData.append(key, String(item)));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/courses/materials/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to create material');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/courses/materials/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to create material');
    }
    return await response.json();
  }
}

export async function updateMaterial(id: number, payload: Partial<Material> & { file?: File }): Promise<Material> {
  const csrftoken = getCsrfToken();
  const { file, ...jsonPayload } = payload;
  
  if (file) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // For ManyToMany fields, append each item separately
          value.forEach(item => formData.append(key, String(item)));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/courses/materials/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to update material');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/courses/materials/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to update material');
    }
    return await response.json();
  }
}

export async function deleteMaterial(id: number): Promise<void> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/courses/materials/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete material');
  }
}

export async function createQuestion(payload: Partial<Question>): Promise<Question> {
  const csrftoken = getCsrfToken();
  const questionType = payload.question_type || 'multiple_choice';
  
  // Determine endpoint based on question type
  let endpoint = `${API_BASE_URL}/quizzes/multiple-choice-questions/`;
  if (questionType === 'order') {
    endpoint = `${API_BASE_URL}/quizzes/order-questions/`;
  } else if (questionType === 'connect') {
    endpoint = `${API_BASE_URL}/quizzes/connect-questions/`;
  } else if (questionType === 'number') {
    endpoint = `${API_BASE_URL}/quizzes/number-questions/`;
  }
  
  const response = await fetch(endpoint, {
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

export async function updateQuestion(id: number, payload: Partial<Question> & { imageFile?: File }, questionType?: 'multiple_choice' | 'order' | 'connect' | 'number'): Promise<Question> {
  const csrftoken = getCsrfToken();
  
  // If questionType not provided, try to infer from payload or fetch first
  let endpoint = `${API_BASE_URL}/quizzes/questions/`; // Default to backward compatibility
  if (questionType === 'order') {
    endpoint = `${API_BASE_URL}/quizzes/order-questions/`;
  } else if (questionType === 'connect') {
    endpoint = `${API_BASE_URL}/quizzes/connect-questions/`;
  } else if (questionType === 'number') {
    endpoint = `${API_BASE_URL}/quizzes/number-questions/`;
  } else if (questionType === 'multiple_choice' || payload.question_type === 'multiple_choice') {
    endpoint = `${API_BASE_URL}/quizzes/multiple-choice-questions/`;
  }
  
  const { imageFile, ...jsonPayload } = payload;
  
  // Use FormData if there's an image file, otherwise use JSON
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${endpoint}${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to update question');
    }
    return await response.json();
  } else {
    const response = await fetch(`${endpoint}${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to update question');
    }
    return await response.json();
  }
}

export async function createOption(payload: Partial<Option> & { imageFile?: File }): Promise<Option> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to create option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to create option');
    }
    return await response.json();
  }
}

export async function updateOption(id: number, payload: Partial<Option> & { imageFile?: File }): Promise<Option> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to update option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to update option');
    }
    return await response.json();
  }
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

// Order Question API functions
export async function createOrderOption(payload: Partial<OrderOption> & { imageFile?: File }): Promise<OrderOption> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/order-options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to create order option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/order-options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to create order option');
    }
    return await response.json();
  }
}

export async function updateOrderOption(id: number, payload: Partial<OrderOption> & { imageFile?: File }): Promise<OrderOption> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/order-options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to update order option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/order-options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to update order option');
    }
    return await response.json();
  }
}

export async function deleteOrderOption(id: number): Promise<void> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/order-options/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete order option');
  }
}

// Connect Question API functions
export async function createConnectOption(payload: Partial<ConnectOption> & { imageFile?: File }): Promise<ConnectOption> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/connect-options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to create connect option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/connect-options/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to create connect option');
    }
    return await response.json();
  }
}

export async function updateConnectOption(id: number, payload: Partial<ConnectOption> & { imageFile?: File }): Promise<ConnectOption> {
  const csrftoken = getCsrfToken();
  const { imageFile, ...jsonPayload } = payload;
  
  if (imageFile) {
    const formData = new FormData();
    Object.entries(jsonPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/quizzes/connect-options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to update connect option');
    }
    return await response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/quizzes/connect-options/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (!response.ok) {
      throw new Error('Failed to update connect option');
    }
    return await response.json();
  }
}

export async function deleteConnectOption(id: number): Promise<void> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/connect-options/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete connect option');
  }
}

export async function createConnectOptionConnection(payload: Partial<ConnectOptionConnection>): Promise<ConnectOptionConnection> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/connect-option-connections/`, {
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
    throw new Error('Failed to create connect option connection');
  }
  return await response.json();
}

export async function deleteConnectOptionConnection(id: number): Promise<void> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/quizzes/connect-option-connections/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete connect option connection');
  }
}

// Student Groups API
export async function fetchStudentGroups(courseId?: number, moduleId?: number): Promise<StudentGroup[]> {
  const qs = new URLSearchParams();
  if (courseId) qs.set('course', String(courseId));
  if (moduleId) qs.set('modules', String(moduleId));
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/students/student-groups/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch student groups');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchStudentGroup(id: number): Promise<StudentGroupDetail> {
  const response = await fetch(`${API_BASE_URL}/students/student-groups/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch student group');
  }
  return await response.json();
}

export async function createStudentGroup(payload: Partial<StudentGroup>): Promise<StudentGroup> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/students/student-groups/`, {
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
    throw new Error('Failed to create student group');
  }
  return await response.json();
}

export async function updateStudentGroup(id: number, payload: Partial<StudentGroup>): Promise<StudentGroup> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/students/student-groups/${id}/`, {
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
    throw new Error('Failed to update student group');
  }
  return await response.json();
}

// Students API
export async function fetchStudents(studentGroupId?: number): Promise<Student[]> {
  const qs = new URLSearchParams();
  if (studentGroupId) qs.set('student_groups', String(studentGroupId));
  const queryString = qs.toString();
  const url = `${API_BASE_URL}/students/students/${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchStudent(id: number): Promise<StudentDetail> {
  const response = await fetch(`${API_BASE_URL}/students/students/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch student');
  }
  return await response.json();
}

export async function createStudent(payload: Partial<Student>): Promise<Student> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/students/students/`, {
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
    throw new Error('Failed to create student');
  }
  return await response.json();
}

export async function updateStudent(id: number, payload: Partial<Student>): Promise<Student> {
  const csrftoken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/students/students/${id}/`, {
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
    throw new Error('Failed to update student');
  }
  return await response.json();
}

// Student Group Progress API
export async function fetchStudentGroupProgress(studentId: number, groupId: number): Promise<TopicProgress[]> {
  const response = await fetch(`${API_BASE_URL}/students/students/${studentId}/group-progress/${groupId}/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch student group progress');
  }
  return await response.json();
}
