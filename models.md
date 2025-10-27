# Models

## "organizations" app
* Organization
  - name: str
  - slug: str
  - description: str
  - created_at: datetime
  - updated_at: datetime

* User
  - username: str
  - email: str
  - password: str
  - organization: Organization
  - is_staff: bool

## "courses" app
* Course
  - name: str
  - description: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization

* Module
  - name: str
  - description: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization
  - course: Course

* Lesson
  - name: str
  - description: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization
  - module: Module

* Topic
  - name: str
  - description: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization
  - lesson: Lesson

* Learning Objective
  - name: str
  - description: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization
  - topics: list[Topic]

## "quizzes" app
* Question
  - text: str
  - created_at: datetime
  - updated_at: datetime
  - organization: Organization
  - learning_objectives: list[LearningObjective]
  - topic: Topic
  - options: list[Option]

* Option
  - text: str
  - is_correct: bool
  - created_at: datetime