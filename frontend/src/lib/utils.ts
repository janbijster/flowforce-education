import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Storage keys for last used selections
const STORAGE_KEYS = {
  LAST_COURSE: 'flowforce-last-course',
  LAST_MODULE: 'flowforce-last-module',
  LAST_LESSON: 'flowforce-last-lesson',
  LAST_TOPIC: 'flowforce-last-topic',
} as const;

// Get last used course ID
export function getLastCourse(): number | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_COURSE);
  return stored ? Number(stored) : null;
}

// Save last used course ID
export function setLastCourse(courseId: number | null): void {
  if (courseId !== null) {
    localStorage.setItem(STORAGE_KEYS.LAST_COURSE, String(courseId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LAST_COURSE);
  }
}

// Get last used module ID
export function getLastModule(): number | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_MODULE);
  return stored ? Number(stored) : null;
}

// Save last used module ID
export function setLastModule(moduleId: number | null): void {
  if (moduleId !== null) {
    localStorage.setItem(STORAGE_KEYS.LAST_MODULE, String(moduleId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LAST_MODULE);
  }
}

// Get last used lesson ID
export function getLastLesson(): number | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_LESSON);
  return stored ? Number(stored) : null;
}

// Save last used lesson ID
export function setLastLesson(lessonId: number | null): void {
  if (lessonId !== null) {
    localStorage.setItem(STORAGE_KEYS.LAST_LESSON, String(lessonId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LAST_LESSON);
  }
}

// Get last used topic ID
export function getLastTopic(): number | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_TOPIC);
  return stored ? Number(stored) : null;
}

// Save last used topic ID
export function setLastTopic(topicId: number | null): void {
  if (topicId !== null) {
    localStorage.setItem(STORAGE_KEYS.LAST_TOPIC, String(topicId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LAST_TOPIC);
  }
}
