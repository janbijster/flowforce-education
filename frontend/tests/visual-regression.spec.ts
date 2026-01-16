import { test, expect } from '@playwright/test';

const pages = [
  // List pages
  { name: 'student-groups-list', path: '/student-groups' },
  { name: 'students-list', path: '/students' },
  { name: 'quizzes-list', path: '/quizzes' },
  { name: 'questions-list', path: '/questions' },
  { name: 'materials-overview', path: '/materials/overview' },

  // Create/New forms
  { name: 'student-groups-new', path: '/student-groups/new' },
  { name: 'students-new', path: '/students/new' },
  { name: 'quizzes-new', path: '/quizzes/new' },
  { name: 'questions-new', path: '/questions/new' },
  { name: 'materials-new', path: '/materials/new' },
];

for (const page of pages) {
  test(`visual snapshot: ${page.name}`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    await browserPage.waitForLoadState('networkidle');
    await expect(browserPage).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
