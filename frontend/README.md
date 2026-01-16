# Flowforce Education - frontend

## Prerequisites

- Node.js 22 (use `nvm use 22` before running any npm commands)

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- [react-router-dom](https://www.npmjs.com/package/react-router-dom) for routing
- [shadcn-ui](https://github.com/shadcn-ui/ui/) for UI components
- [radix-ui/icons](https://www.radix-ui.com/icons) for icons
- [i18next](https://www.i18next.com/) for internationalization (English, Dutch)

## Getting Started

```bash
nvm use 22
npm install
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
frontend/src/
├── pages/              # Page components (Dashboard, Students, Quizzes, etc.)
├── components/         # Reusable components
│   ├── layouts/        # App layout, header, footer
│   └── ui/             # shadcn/ui components (button, card, table, etc.)
├── contexts/           # React contexts (Auth, Theme, Language)
├── hooks/              # Custom hooks (useTheme, useLanguage)
├── lib/                # Utilities
│   ├── api.ts          # TypeScript API client
│   ├── utils.ts        # Helper functions
│   ├── i18n.ts         # i18next configuration
│   └── locales/        # Translation files (en.json, nl.json)
├── config/             # Configuration
├── App.tsx             # Root app with providers
├── Router.tsx          # Route definitions
└── main.tsx            # Entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run visual regression tests
- `npm run test:update` - Update visual test baselines
- `npm run test:ui` - Run tests in interactive UI mode

## Visual Regression Testing

The frontend uses Playwright for visual snapshot testing to ensure UI consistency during refactoring.

```bash
# Run tests (compares against baselines)
npm test

# Update baselines after intentional UI changes
npm run test:update

# Interactive UI mode for debugging
npm run test:ui
```

Snapshots are stored in `tests/visual-regression.spec.ts-snapshots/`.

## Features

- **Dark/Light Mode**: Toggle in the header
- **Language Switching**: English and Dutch supported
- **Responsive Design**: Tailwind CSS responsive utilities
