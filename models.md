# Models

This document describes the data models in the FlowForce Education backend.

## Base Models

### TimestampedModel (abstract)
All models inherit timestamps:
- `created_at`: datetime (auto)
- `updated_at`: datetime (auto)

### OrganizationModel (abstract)
All tenant-scoped models inherit:
- `organization`: FK to Organization
- Plus all TimestampedModel fields

---

## "organizations" app

### Organization
- `name`: str (unique)
- `slug`: str (unique)
- `description`: str

### User
Custom user model extending Django's AbstractUser:
- `username`: str
- `email`: str
- `organization`: FK to Organization (nullable)
- `is_staff`: bool

---

## "courses" app

Content hierarchy: Course → Module → Lesson → Topic

### Course
- `name`: str
- `description`: str
- `organization`: FK

### Module
- `name`: str
- `description`: str
- `course`: FK to Course
- `organization`: FK

### Lesson
- `name`: str
- `description`: str
- `module`: FK to Module
- `organization`: FK

### Topic
Topics serve as learning objectives in the system.
- `name`: str
- `description`: str
- `lesson`: FK to Lesson
- `organization`: FK

### Material
Learning materials (readers, presentations) that can be linked at multiple hierarchy levels.
- `title`: str
- `description`: str
- `order`: int
- `material_type`: choice ('reader', 'presentation')
- `course`: FK to Course (nullable)
- `modules`: M2M to Module
- `lessons`: M2M to Lesson
- `topics`: M2M to Topic
- `file`: FileField (upload)
- `content`: str (rich text)
- `slide_count`: int (nullable)
- `organization`: FK

---

## "quizzes" app

### Quiz
- `name`: str
- `description`: str
- `course`: FK to Course (nullable)
- `module`: FK to Module (nullable)
- `lessons`: M2M to Lesson
- `topics`: M2M to Topic
- `organization`: FK

### BaseQuestion (abstract)
All question types inherit:
- `text`: str
- `order`: int
- `question_type`: choice ('multiple_choice', 'order', 'connect', 'number')
- `image`: ImageField (nullable)
- `video`: FileField (nullable)
- `hide_text`: bool (for accessibility - use text as alt-text)
- `quiz`: FK to Quiz (nullable)
- `topic`: FK to Topic
- `organization`: FK

### MultipleChoiceQuestion
Inherits BaseQuestion. Traditional multiple choice with options.

### Option
Options for MultipleChoiceQuestion:
- `text`: str
- `is_correct`: bool
- `image`: ImageField (nullable)
- `hide_text`: bool
- `question`: FK to MultipleChoiceQuestion
- `organization`: FK

### OrderQuestion
Inherits BaseQuestion. Students order items correctly.

### OrderOption
- `text`: str
- `image`: ImageField (nullable)
- `hide_text`: bool
- `correct_order`: int (1-based position)
- `question`: FK to OrderQuestion
- `organization`: FK

### ConnectQuestion
Inherits BaseQuestion. Students connect/match items with lines.

### ConnectOption
- `text`: str
- `image`: ImageField (nullable)
- `connectable`: bool (whether connections can be made to/from this)
- `hide_text`: bool
- `position_x`: float (0.0 to 1.0)
- `position_y`: float (0.0 to 1.0)
- `width`: float (pixels)
- `height`: float (pixels)
- `question`: FK to ConnectQuestion
- `organization`: FK

### ConnectOptionConnection
Defines correct connections between ConnectOptions:
- `question`: FK to ConnectQuestion
- `from_option`: FK to ConnectOption
- `to_option`: FK to ConnectOption
- `organization`: FK

### NumberQuestion
Inherits BaseQuestion. Numeric answer with tolerance.
- `correct_answer`: float
- `tolerance`: float (answer correct if within ±tolerance)

---

## "students" app

### StudentGroup
- `name`: str
- `course`: FK to Course
- `modules`: M2M to Module
- `year`: int
- `organization`: FK

### Student
- `user`: OneToOne to User (nullable)
- `first_name`: str
- `last_name`: str
- `email`: str
- `student_groups`: M2M to StudentGroup
- `organization`: FK

### StudentQuestionAnswer
Tracks student answers using GenericForeignKey to support all question types:
- `student`: FK to Student
- `question_content_type`: FK to ContentType
- `question_id`: int
- `question`: GenericForeignKey
- `quiz`: FK to Quiz
- `answer`: FK to Option (for MultipleChoiceQuestion, nullable)
- `answer_data`: JSON (for Order/Connect/Number questions)
- `organization`: FK

Answer formats by question type:
- **MultipleChoiceQuestion**: uses `answer` FK to selected Option
- **OrderQuestion**: `answer_data` = [option_id, option_id, ...] in student's order
- **ConnectQuestion**: `answer_data` = [[from_id, to_id], ...] connection pairs
- **NumberQuestion**: `answer_data` = numeric value
