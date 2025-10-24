# FlowForce Education — Agent Context

## Repository layout
The repository consists of a `frontend/` and `backend/` folder.

- `backend/` is a Django project (Python, Django REST Framework).
- `frontend/` is a React application (student/teacher UI, quiz interface, dashboards).

PostgreSQL is used as the main database. (SQLite can be used for local development)

---

## High-level product vision
FlowForce Education is an AI-driven assessment and feedback layer that measures learner mastery at a very fine-grained level (per topic / per learning objective) and uses that to personalize what they should learn next. :contentReference[oaicite:11]{index=11}

Instead of “this student got a 6/10 on chapter 2”, the system can say “this student has mastered 5 of the 7 learning objectives in chapter 2, and is still weak on objectives X and Y.” This allows precise remediation and targeted follow-up. :contentReference[oaicite:12]{index=12}

The platform is designed to sit alongside / plug into existing LMS systems, not replace them. It can also generate proof of progress for training, certification, or inspection. :contentReference[oaicite:13]{index=13}

---

## Core functional flow
1. **Content ingestion / breakdown**
   - Teaching material is split into small learning units (learning objectives, paragraphs, concepts).
   - This breakdown step is assisted by AI so it’s fast and does not require a lot of manual authoring. :contentReference[oaicite:14]{index=14}

2. **Question generation**
   - For each learning unit, the AI generates multiple-choice questions (including variants).
   - Questions are stored in the backend and can be served to the frontend. :contentReference[oaicite:15]{index=15}

3. **Adaptive assessment**
   - Each student gets short, regular quizzes.
   - Quizzes are personalized based on what that student has / has not yet mastered.
   - Each quiz instance can be unique per student. :contentReference[oaicite:16]{index=16}

4. **Mastery tracking**
   - The backend tracks per-learning-objective mastery instead of only storing a single test grade.
   - This enables statements like “Student masters learning objectives A, B, D, but not C or E (yet).” :contentReference[oaicite:17]{index=17}

5. **Guidance & reporting**
   - The system recommends what the learner should practice next.
   - The system shows the instructor where the group is weak, and where time in class/training should be focused.
   - Results can be pushed back into an LMS or exported as reports. :contentReference[oaicite:18]{index=18}

---

## Business context / who we're building for
There are three initial customer types: :contentReference[oaicite:19]{index=19}  
1. **Commercial exam-prep / tutoring institutes**  
   - They care about pass rates and proof that their approach works.

2. **Companies with internal training / certification needs**  
   - They need recurring compliance training and want proof that employees actually understand critical topics.

3. **Schools (primary / secondary / MBO)**  
   - They need personalized follow-up for each student and transparent insight into gaps for inspectors / regulators.

The go-to-market strategy starts in commercial settings because the sales cycle is faster and the value (compliance, certification, pass rates) is immediate and provable. After that, we scale toward schools with evidence. :contentReference[oaicite:20]{index=20}

---

## Tech stack details

### Backend (`backend/`)
- Django + Django REST Framework.
- Responsible for:
  - Storing learning objectives, questions, quiz instances, and mastery scores.
  - Serving personalized quizzes per student.
  - Returning analytics dashboards data (per student / per group).
  - Handling LMS integrations.
- Exposes a REST API consumed by the React frontend.
- Will call out to LLMs for:
  - Splitting content into learning objectives.
  - Generating multiple-choice questions and distractors.
  - (Future) Explaining why an answer was wrong in student-friendly language. :contentReference[oaicite:21]{index=21}

### Frontend (`frontend/`)
- React.
- Responsible for:
  - Student quiz UI (answering questions).
  - Teacher / trainer dashboard (who is behind on what).
  - Progress and mastery visualizations (“green/orange/red per learning goal”).
- Should support both frequent low-stakes micro-quizzes and reviewing past results. :contentReference[oaicite:22]{index=22}

### Database
- Postgres.

### AI layer
- Uses an external LLM (OpenAI, Mistral, or self-hosted model) for:
  - Content breakdown.
  - Question generation.
- Long-term plan: move toward fine-tuned / on-prem models for data control and cost. :contentReference[oaicite:23]{index=23}

---

## Integrations / interoperability

### LTI 1.3 (LTI Advantage)
- Standard way to plug into an LMS.
- Handles:
  - Authentication / SSO.
  - Context passing (which course, which learner).
  - Score passback (sending mastery/score back to LMS gradebook). :contentReference[oaicite:24]{index=24}

### SCORM
- For legacy LMS environments.
- We can export training modules as SCORM packages so they can be “played” inside an LMS that expects SCORM.
- SCORM also allows basic completion tracking (“completed / passed / score”). :contentReference[oaicite:25]{index=25}

### xAPI
- Optional.
- Used for sending learning event statements (e.g. “User X answered question Y incorrectly at time T”) to an external LRS if the client requires that. :contentReference[oaicite:26]{index=26}

### Target LMS platforms
- Moodle, Canvas, Brightspace, Blackboard, itslearning. These are common targets for LTI / SCORM integration and where we expect to embed. :contentReference[oaicite:27]{index=27}

---

## Privacy / compliance assumptions
- Student data is pseudonymized in our system.
- We do not store direct personal information if we can avoid it.
- We aim to be GDPR-compliant (per-tenant data processing agreement, retention policy, etc.).
- Multi-tenant architecture must allow data isolation. :contentReference[oaicite:28]{index=28}

---

## Agent responsibilities (how AI coding assistants should act)

When generating or modifying code, follow these principles:

1. **Do not break the integration contract.**  
   - APIs in the backend must stay predictable for the React frontend.
   - Keep request/response schemas stable unless explicitly evolving both sides.

2. **Everything is traceable to a learning objective.**  
   - Any quiz question, any mastery score, any dashboard metric should reference a specific learning objective ID.

3. **Personalization is per learner.**  
   - Any “generate quiz” flow should accept a learner context (or pseudonymous learner ID) and return only what that learner should get next.

4. **Respect privacy by design.**  
   - Never introduce code that stores raw personal data unless required.
   - Prefer anonymized / pseudonymized identifiers.
   - Assume data isolation between customers (tenants).

5. **Prepare for external LMS embedding.**  
   - UIs should be embeddable (iframe-friendly layouts, responsive, minimal nav chrome).
   - Backend should expose clean LTI and SCORM/xAPI integration points.

6. **Optimize for instructor time savings.**  
   - Features that auto-generate content, summarize gaps, or highlight who needs help first are high priority.

---

## Short summary for future contributors / AI agents
We are building an assessment + mastery tracking layer that plugs into existing LMS platforms.  
The backend (Django + DRF) stores learning objectives, generates and serves adaptive quizzes, and tracks mastery over time.  
The frontend (React) delivers quizzes and dashboards.  
The AI layer creates questions and breaks down source material into measurable learning objectives.  
Everything must be privacy-aware, embeddable in other LMSs via standards like LTI/SCORM, and aligned with real commercial training and certification use cases. :contentReference[oaicite:29]{index=29}
