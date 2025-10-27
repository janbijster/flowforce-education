# Flowforce Education - backend

## Tech stack

- Poetry for dependency management
- PostgreSQL database
- Whitenoise for static file serving
- Render.com deployment configuration
- Environment variable management

## Prerequisites

- Python 3.12
- Poetry
- PostgreSQL 14 or later (required for Django 5.2)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

### 2. Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your local settings:
```bash
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here  # Generate a secure key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=your_local_db_name
DB_USER=your_local_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Set Up Poetry and Install Dependencies

> **Important**: Before proceeding, make sure to change the project name in `pyproject.toml` to match your project name. This should be done before initializing Poetry to avoid virtual environment issues.

1. Install dependencies:
```bash
poetry install
```

### 4. Set Up the Database

#### For Mac Users (using Postgres.app)

1. Check your PostgreSQL version:
```bash
psql --version
```

2. If you have PostgreSQL 13 or earlier, you need to upgrade to PostgreSQL 14 or later:
   - Download the latest version from [Postgres.app](https://postgresapp.com/)
   - Install and restart the app
   - The app will automatically migrate your data to the new version

3. Open Terminal and connect to PostgreSQL:
```bash
psql postgres
```

4. Create a new database (replace `your_db_name` with your preferred name):
```sql
CREATE DATABASE your_db_name;
```

5. Create a user and set a password:
```sql
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
```

6. Grant all necessary permissions:
```sql
-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_db_user;

-- Connect to the new database
\c your_db_name

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO your_db_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_db_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO your_db_user;

-- Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO your_db_user;
```

7. Exit psql:
```sql
\q
```

8. Update your `.env` file with the database credentials you just created.

9. Run migrations:
```bash
poetry run python manage.py migrate
```

### 5. Run the Development Server

```bash
poetry run python manage.py runserver
```

Visit http://localhost:8000 to see your application running.

## Management Commands

### Creating Dummy Data

The project includes management commands to create sample data for development and testing.

#### BHV Certification Dummy Data

To create comprehensive dummy content for a Dutch BHV (Bedrijfshulpverlening) certification company:

```bash
poetry run python manage.py create_bhv_dummy_data
```

This command creates:
- **Organization**: BHV instituut
- **3 Courses**: Basisopleiding BHV, Herhalingscursus BHV, Specialistische BHV
- **4 Modules**: Levensreddende Eerste Hulp, Brandbestrijding en Ontruiming, etc.
- **4 Lessons**: Bewustzijn en Reanimatie, Brand herkennen en bestrijden, etc.
- **8 Topics**: Bewustzijn controleren, Reanimatie toepassen, etc.
- **16 Learning Objectives**: Comprehensive BHV competencies

The command is idempotent (safe to run multiple times) and uses transactions to ensure data integrity.

### API Endpoints Summary

Once the server is running, you can access:

- **Organizations**: http://localhost:8000/api/organizations/organizations/
- **Courses**: http://localhost:8000/api/courses/courses/
- **Modules**: http://localhost:8000/api/courses/modules/
- **Lessons**: http://localhost:8000/api/courses/lessons/
- **Topics**: http://localhost:8000/api/courses/topics/
- **Learning Objectives**: http://localhost:8000/api/courses/learning-objectives/
- **Questions**: http://localhost:8000/api/quizzes/questions/
- **Options**: http://localhost:8000/api/quizzes/options/

All endpoints support filtering, search, and pagination.

#### Default Organization

To create a basic default organization:

```bash
poetry run python manage.py create_default_org
```

### Django Admin

After creating dummy data, you can view and manage it through the Django admin interface:

1. Create a superuser:
```bash
poetry run python manage.py createsuperuser
```

2. Start the development server:
```bash
poetry run python manage.py runserver
```

3. Visit http://localhost:8000/admin/ to access the admin interface

## API Documentation

The API is fully documented using OpenAPI 3.0 (Swagger). Access the interactive documentation at:

- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Generating the OpenAPI Schema

To generate a static OpenAPI YAML file for your API:

```bash
poetry run python manage.py spectacular --file openapi.yaml
```

This generates a comprehensive OpenAPI specification file that can be:
- Imported into API clients (Postman, Insomnia, etc.)
- Used by AI agents and code generators
- Referenced in your documentation
- Shared with frontend developers

The generated `openapi.yaml` file contains complete schemas for all endpoints, request/response models, authentication methods, and filtering options.

## Deployment to Render.com

### 1. Push to Git Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Connect to Render.com

1. Sign up for a Render.com account
2. Click "New +" and select "Blueprint"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` file

### 3. Configure Environment Variables

In the Render.com dashboard:
1. Go to your web service settings
2. Add the following environment variables:
   - `DEBUG`: Set to `False` for production
   - `DB_NAME`: Your Render PostgreSQL database name
   - `DB_USER`: Your Render PostgreSQL user
   - `DB_PASSWORD`: Your Render PostgreSQL password
   - `DB_HOST`: Your Render PostgreSQL host
   - `DB_PORT`: 5432
   - `RENDER_EXTERNAL_HOSTNAME`: Your Render app URL

### 4. Deploy

Render will automatically:
1. Create a PostgreSQL database
2. Run the build script
3. Collect static files
4. Run migrations
5. Start the application

## Project Structure

```
.
├── .env.example           # Example environment variables
├── .gitignore            # Git ignore file
├── build.sh              # Build script for Render
├── config/               # Django project configuration
├── manage.py             # Django management script
├── poetry.lock          # Poetry lock file
├── pyproject.toml       # Project dependencies
├── README.md            # This file
└── render.yaml          # Render.com configuration
```

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [Render.com Documentation](https://render.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Postgres.app Download](https://postgresapp.com/)
