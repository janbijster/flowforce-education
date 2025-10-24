# Flowforce Education

## Project Overview

...

## Repository Purpose

...


## Current Status



## Technology Stack

- **Frontend Framework**: React 18.2.0 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: react-router-dom 6.16.0
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Icons**: @radix-ui/react-icons
- **Build Tool**: Vite 3.1.0
- **Package Manager**: npm

## Key Dependencies

### Core Dependencies
- React 18.2.0 with TypeScript 4.6.4
- Vite for build tooling and dev server
- Tailwind CSS for styling
- React Router DOM for navigation

### UI Component Libraries
- Radix UI primitives (accordion, avatar, dialog, dropdown-menu, scroll-area, slot)
- shadcn-ui component system
- class-variance-authority for component variants
- tailwind-merge for class merging

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Project Structure

The project follows a typical React + Vite structure with:
- `/src/components/` - React components (editor, layouts, ui)
- `/src/pages/` - Page components
- `/src/config/` - Configuration files
- `/src/contexts/` - React contexts
- `/src/hooks/` - Custom React hooks
- `/src/data/` - Mock data and static content
- `/src/lib/` - Utility functions

## Development Guidelines

- Built for the long run - code will be read, maintained, modified and extended
- Minimize complexity - less is more
- Prefer built-in functionality and existing dependencies over custom logic
- Avoid code duplication - suggest abstractions for repeated code
- Use and configure components over creating custom logic when possible
