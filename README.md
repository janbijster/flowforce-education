# FlowForce Education

An AI-driven assessment and feedback layer that measures learner mastery at a fine-grained level (per topic/learning objective) and uses that to personalize what they should learn next.

## Overview

FlowForce Education is designed to sit alongside existing LMS systems, providing precise mastery tracking and adaptive assessments. Instead of traditional "6/10 on chapter 2" grades, the system can identify exactly which learning objectives a student has mastered and which need more practice.

## Key Features

- **Fine-grained mastery tracking** - Track progress per learning objective
- **AI-powered content breakdown** - Automatically split teaching material into measurable learning units
- **Adaptive assessments** - Personalized quizzes based on individual mastery levels
- **LMS integration** - Plug into existing learning management systems via LTI, SCORM, and xAPI
- **Privacy-focused** - Pseudonymized student data with multi-tenant architecture

## Project Structure

This repository contains both frontend and backend components:

- **Frontend** (`frontend/`) - React application with student/teacher UI, quiz interface, and dashboards
- **Backend** (`backend/`) - Django REST API for storing learning objectives, generating quizzes, and tracking mastery

## Getting Started

### Frontend
See [frontend/README.md](frontend/README.md) for React setup instructions.

### Backend  
See [backend/README.md](backend/README.md) for Django setup instructions.

## Target Users

- **Commercial exam-prep/tutoring institutes** - Focus on pass rates and proof of effectiveness
- **Companies with training/certification needs** - Compliance training with proof of understanding
- **Schools (primary/secondary/MBO)** - Personalized follow-up and transparent gap analysis

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Django + Django REST Framework + PostgreSQL
- **AI**: External LLM integration for content breakdown and question generation
- **Integrations**: LTI 1.3, SCORM, xAPI for LMS compatibility

## Documentation

For detailed setup and development instructions, see:
- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/README.md)
- [Agent Context](agents.md) - Detailed project context for AI assistants
