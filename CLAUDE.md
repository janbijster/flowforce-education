# FlowForce Education - Claude Code Context

## Quick Reference

@agents.md - Full project context, business vision, and tech stack details
@models.md - Data model reference

## Development Commands

### Backend (Django)
```bash
cd backend
poetry install
poetry run python manage.py runserver  # http://localhost:8000
poetry run python manage.py migrate
poetry run python manage.py createsuperuser
```

### Frontend (React)
```bash
cd frontend
nvm use 22
npm install
npm run dev  # http://localhost:5173
```

### Management Commands
- `poetry run python manage.py create_bhv_dummy_data` - Create BHV certification dummy data
- `poetry run python manage.py create_installatie_dummy_data` - Create installation dummy data
- `poetry run python manage.py populate_quizzes` - Create sample quiz questions

## API Documentation
- Swagger UI: http://localhost:8000/api/schema/swagger-ui/
- ReDoc: http://localhost:8000/api/schema/redoc/

## Project Architecture

### Content Hierarchy
Course → Module → Lesson → Topic (learning objective)

### Question Types
- MultipleChoiceQuestion (with Option)
- OrderQuestion (with OrderOption)
- ConnectQuestion (with ConnectOption + ConnectOptionConnection)
- NumberQuestion (with tolerance)

### Multi-Tenant
All models inherit from OrganizationModel with organization FK for data isolation.

## Code Style Guidelines

### Backend
- Use Django REST Framework ViewSets and Serializers
- All models must inherit from OrganizationModel (except Organization itself)
- Use django-filter for filtering endpoints

### Frontend
- Use TypeScript strictly
- Use shadcn/ui components from `@/components/ui/`
- Use `useTranslation` hook for all user-facing text
- API calls go through `@/lib/api.ts`
- Use existing patterns - check similar pages before writing new code

## Known Technical Debt

### Frontend Refactoring Needed
The frontend has significant code duplication that should be refactored:

1. **List pages** (Students, StudentGroups, Quizzes, Questions, Materials) share ~70% identical code:
   - Same loading/error state handling
   - Same filter dropdown patterns
   - Same table structures

2. **Suggested reusable components to create:**
   - `<LoadingError>` - Handles loading/error states consistently
   - `<FilterSelect>` - Reusable filter dropdown
   - `<DataTable>` - Consistent table with row click handling
   - `<ListPageLayout>` - Wrapper for list pages
   - `<DetailPageLayout>` - Wrapper for detail pages

3. **Suggested custom hooks:**
   - `useListData<T>` - Handles fetch, loading, error, filtering
   - `useCascadingSelect` - Handles dependent dropdown cascades
   - `useFormEditor<T>` - Handles editor page initialization

See the frontend refactoring plan for detailed implementation guidance.
