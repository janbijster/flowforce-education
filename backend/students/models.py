from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.exceptions import ValidationError
from organizations.models import OrganizationModel


class StudentGroup(OrganizationModel):
    """StudentGroup model representing a group of students enrolled in a course."""
    
    name = models.CharField(max_length=255)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='student_groups'
    )
    modules = models.ManyToManyField(
        'courses.Module',
        related_name='student_groups',
        blank=True
    )
    year = models.IntegerField()
    
    class Meta:
        ordering = ['year', 'name']
        unique_together = ['organization', 'course', 'year', 'name']
    
    def __str__(self):
        return f"{self.course.name} - {self.year} - {self.name}"


class Student(OrganizationModel):
    """Student model representing a learner in the system."""
    
    user = models.OneToOneField(
        'organizations.User',
        on_delete=models.CASCADE,
        related_name='student_profile',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    student_groups = models.ManyToManyField(
        StudentGroup,
        related_name='students',
        blank=True
    )
    
    class Meta:
        ordering = ['last_name', 'first_name']
        unique_together = ['organization', 'user']
    
    def __str__(self):
        groups = ', '.join([g.name for g in self.student_groups.all()[:2]])
        if self.student_groups.count() > 2:
            groups += '...'
        return f"{self.first_name} {self.last_name}" + (f" ({groups})" if groups else "")


class StudentQuestionAnswer(OrganizationModel):
    """StudentQuestionAnswer model tracking student answers to quiz questions.
    
    Supports different question types:
    - MultipleChoiceQuestion: uses 'answer' ForeignKey to Option
    - OrderQuestion: uses 'answer_data' JSONField with list of option IDs in order
    - ConnectQuestion: uses 'answer_data' JSONField with list of connection pairs
    - NumberQuestion: uses 'answer_data' JSONField with numeric value
    """
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='question_answers'
    )
    # Generic foreign key to support all question types
    question_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={'model__in': ['multiplechoicequestion', 'orderquestion', 'connectquestion', 'numberquestion']},
        null=True,  # Nullable for migration
        blank=True
    )
    question_id = models.PositiveIntegerField(null=True, blank=True)  # Nullable for migration
    question = GenericForeignKey('question_content_type', 'question_id')
    quiz = models.ForeignKey(
        'quizzes.Quiz',
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    # For MultipleChoiceQuestion: reference to the selected Option
    answer = models.ForeignKey(
        'quizzes.Option',
        on_delete=models.CASCADE,
        related_name='student_selections',
        null=True,
        blank=True
    )
    # For OrderQuestion and ConnectQuestion: JSON data
    # OrderQuestion: [option_id1, option_id2, ...] in the order provided by student
    # ConnectQuestion: [[from_option_id, to_option_id], ...] list of connection pairs
    answer_data = models.JSONField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['organization', 'student', 'question_content_type', 'question_id', 'quiz']
    
    def clean(self):
        """Validate that answer or answer_data is provided based on question type."""
        # Safely access the question
        try:
            if not self.question_content_type_id or not self.question_id:
                return
            question = self.question
            if not question:
                return
        except (AttributeError, Exception):
            # If question can't be accessed, skip validation
            return
        
        question_type = question.question_type
        
        if question_type == 'multiple_choice':
            if not self.answer:
                raise ValidationError({'answer': 'Answer (Option) is required for multiple choice questions.'})
            if self.answer_data:
                raise ValidationError({'answer_data': 'answer_data should not be set for multiple choice questions.'})
        elif question_type in ['order', 'connect', 'number']:
            if self.answer:
                raise ValidationError({'answer': f'answer should not be set for {question_type} questions.'})
            if not self.answer_data:
                raise ValidationError({'answer_data': f'answer_data is required for {question_type} questions.'})
    
    def save(self, *args, **kwargs):
        """Validate before saving."""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        # Safely access question text
        try:
            question = self.question
            question_text = getattr(question, 'text', 'Unknown')[:50] if question else 'Unknown'
        except (AttributeError, Exception):
            question_text = 'Unknown'
        return f"{self.student} - {question_text}..."
    
    @property
    def correct(self):
        """Check if the answer is correct based on question type."""
        # Safely access the question via GenericForeignKey
        # Handle cases where ContentType is invalid or question doesn't exist
        try:
            # Check if we have valid content_type and question_id
            if not self.question_content_type_id or not self.question_id:
                return False
            
            # Try to get the ContentType and verify it's valid
            ct = self.question_content_type
            if not ct or ct.model_class() is None:
                return False
            
            # Now try to access the question (this may fail if question was deleted)
            question = self.question
            if not question:
                return False
        except (AttributeError, Exception):
            # If ContentType is invalid or question doesn't exist, return False
            return False
        
        question_type = question.question_type
        
        if question_type == 'multiple_choice':
            return self.answer.is_correct if self.answer else False
        
        elif question_type == 'order':
            if not self.answer_data or not isinstance(self.answer_data, list):
                return False
            
            # Get correct order from OrderOptions
            from quizzes.models import OrderOption
            order_options = OrderOption.objects.filter(
                question=question,
                organization=self.organization
            ).order_by('correct_order')
            
            correct_order = [opt.id for opt in order_options]
            
            # Compare student's order with correct order
            return self.answer_data == correct_order
        
        elif question_type == 'connect':
            if not self.answer_data or not isinstance(self.answer_data, list):
                return False
            
            # Get correct connections
            from quizzes.models import ConnectOptionConnection
            correct_connections = ConnectOptionConnection.objects.filter(
                question=question,
                organization=self.organization
            )
            
            # Build set of correct connection pairs (bidirectional)
            correct_pairs = set()
            for conn in correct_connections:
                pair = tuple(sorted([conn.from_option_id, conn.to_option_id]))
                correct_pairs.add(pair)
            
            # Build set of student's connection pairs
            student_pairs = set()
            for pair in self.answer_data:
                if isinstance(pair, list) and len(pair) == 2:
                    student_pairs.add(tuple(sorted(pair)))
            
            # Check if student's connections match exactly
            return student_pairs == correct_pairs
        
        elif question_type == 'number':
            # For number questions, we need to check if answer_data matches correct_answer within tolerance
            if not hasattr(question, 'correct_answer'):
                return False
            
            try:
                student_answer = float(self.answer_data) if self.answer_data is not None else None
                if student_answer is None:
                    return False
                
                correct_answer = question.correct_answer
                tolerance = getattr(question, 'tolerance', 0.0)
                
                return abs(student_answer - correct_answer) <= tolerance
            except (ValueError, TypeError):
                return False
        
        return False

