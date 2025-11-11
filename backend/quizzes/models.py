from django.db import models
from organizations.models import OrganizationModel


class Quiz(OrganizationModel):
    """Quiz model representing a collection of questions for testing."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='quizzes',
        null=True,
        blank=True
    )
    module = models.ForeignKey(
        'courses.Module',
        on_delete=models.CASCADE,
        related_name='quizzes',
        null=True,
        blank=True
    )
    lessons = models.ManyToManyField(
        'courses.Lesson',
        related_name='quizzes',
        blank=True
    )
    topics = models.ManyToManyField(
        'courses.Topic',
        related_name='quizzes',
        blank=True
    )
    
    class Meta:
        ordering = ['created_at']
        unique_together = ['organization', 'name']
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'
    
    def __str__(self):
        return self.name
    
    def get_all_questions(self):
        """Get all questions of any type for this quiz."""
        questions = []
        # Use the related_name from BaseQuestion: %(class)s_questions
        questions.extend(self.multiplechoicequestion_questions.all())
        questions.extend(self.orderquestion_questions.all())
        questions.extend(self.connectquestion_questions.all())
        questions.extend(self.numberquestion_questions.all())
        return sorted(questions, key=lambda q: (q.order, q.created_at))


class BaseQuestion(OrganizationModel):
    """Abstract base model for all question types."""
    
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('order', 'Order'),
        ('connect', 'Connect'),
        ('number', 'Number'),
    ]
    
    text = models.TextField()
    order = models.PositiveIntegerField(default=0, db_index=True)
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        db_index=True
    )
    image = models.ImageField(upload_to='questions/', blank=True, null=True)
    video = models.FileField(upload_to='questions/videos/', blank=True, null=True)
    hide_text = models.BooleanField(
        default=False,
        help_text="If True, hide the text and use it as alt-text for the image (for accessibility)"
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='%(class)s_questions',
        null=True,
        blank=True
    )
    topic = models.ForeignKey(
        'courses.Topic',
        on_delete=models.CASCADE,
        related_name='%(class)s_questions'
    )
    learning_objectives = models.ManyToManyField(
        'courses.LearningObjective',
        related_name='%(class)s_questions',
        blank=True
    )
    
    class Meta:
        abstract = True
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.topic.name} - {self.text[:50]}..."


class MultipleChoiceQuestion(BaseQuestion):
    """Multiple choice question with options."""
    
    class Meta(BaseQuestion.Meta):
        pass
    
    def save(self, *args, **kwargs):
        """Automatically set question_type on save."""
        self.question_type = 'multiple_choice'
        super().save(*args, **kwargs)


class Option(OrganizationModel):
    """Option model representing answer choices for multiple choice questions."""
    
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    image = models.ImageField(upload_to='options/', blank=True, null=True)
    hide_text = models.BooleanField(
        default=False,
        help_text="If True, hide the text and use it as alt-text for the image (for accessibility)"
    )
    question = models.ForeignKey(
        MultipleChoiceQuestion,
        on_delete=models.CASCADE,
        related_name='options'
    )
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.question.text[:30]}... - {self.text[:30]}..."


class OrderQuestion(BaseQuestion):
    """Question where students need to order options correctly."""
    
    class Meta(BaseQuestion.Meta):
        pass
    
    def save(self, *args, **kwargs):
        """Automatically set question_type on save."""
        self.question_type = 'order'
        super().save(*args, **kwargs)


class OrderOption(OrganizationModel):
    """Option for order questions with a correct position."""
    
    text = models.TextField()
    image = models.ImageField(upload_to='order_options/', blank=True, null=True)
    hide_text = models.BooleanField(
        default=False,
        help_text="If True, hide the text and use it as alt-text for the image (for accessibility)"
    )
    correct_order = models.PositiveIntegerField(
        help_text="The correct position in the order (1-based)"
    )
    question = models.ForeignKey(
        OrderQuestion,
        on_delete=models.CASCADE,
        related_name='order_options'
    )
    
    class Meta:
        ordering = ['correct_order', 'id']
    
    def __str__(self):
        return f"{self.question.text[:30]}... - {self.text[:30]}... (order: {self.correct_order})"


class ConnectQuestion(BaseQuestion):
    """Question where students need to connect options with lines."""
    
    class Meta(BaseQuestion.Meta):
        pass
    
    def save(self, *args, **kwargs):
        """Automatically set question_type on save."""
        self.question_type = 'connect'
        super().save(*args, **kwargs)


class ConnectOption(OrganizationModel):
    """Option for connect questions with fixed position and optional image."""
    
    text = models.TextField()
    image = models.ImageField(upload_to='connect_options/', blank=True, null=True)
    hide_text = models.BooleanField(
        default=False,
        help_text="If True, hide the text and use it as alt-text for the image (for accessibility)"
    )
    position_x = models.FloatField(help_text="X position (0.0 to 1.0)")
    position_y = models.FloatField(help_text="Y position (0.0 to 1.0)")
    width = models.FloatField(default=100.0, help_text="Width in pixels")
    height = models.FloatField(default=60.0, help_text="Height in pixels")
    question = models.ForeignKey(
        ConnectQuestion,
        on_delete=models.CASCADE,
        related_name='connect_options'
    )
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.question.text[:30]}... - {self.text[:30]}... ({self.position_x}, {self.position_y})"


class ConnectOptionConnection(OrganizationModel):
    """Defines correct connections between connect options."""
    
    question = models.ForeignKey(
        ConnectQuestion,
        on_delete=models.CASCADE,
        related_name='correct_connections'
    )
    from_option = models.ForeignKey(
        ConnectOption,
        on_delete=models.CASCADE,
        related_name='connections_from'
    )
    to_option = models.ForeignKey(
        ConnectOption,
        on_delete=models.CASCADE,
        related_name='connections_to'
    )
    
    class Meta:
        unique_together = ['organization', 'question', 'from_option', 'to_option']
    
    def __str__(self):
        return f"{self.question.text[:30]}... - {self.from_option.text[:20]}... → {self.to_option.text[:20]}..."


class NumberQuestion(BaseQuestion):
    """Question where students need to enter a number as the answer."""
    
    correct_answer = models.FloatField(
        help_text="The correct numeric answer"
    )
    tolerance = models.FloatField(
        default=0.0,
        help_text="Tolerance for the answer (e.g., 0.1 means answer is correct if within ±0.1 of correct_answer)"
    )
    
    class Meta(BaseQuestion.Meta):
        pass
    
    def save(self, *args, **kwargs):
        """Automatically set question_type on save."""
        self.question_type = 'number'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.topic.name} - {self.text[:50]}... (answer: {self.correct_answer})"


# Backward compatibility alias
Question = MultipleChoiceQuestion