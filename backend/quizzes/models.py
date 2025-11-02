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
    
    def __str__(self):
        return self.name


class Question(OrganizationModel):
    """Question model representing quiz questions."""
    
    text = models.TextField()
    order = models.PositiveIntegerField(default=0, db_index=True)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        null=True,
        blank=True
    )
    topic = models.ForeignKey(
        'courses.Topic',
        on_delete=models.CASCADE,
        related_name='questions'
    )
    learning_objectives = models.ManyToManyField(
        'courses.LearningObjective',
        related_name='questions',
        blank=True
    )
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.topic.name} - {self.text[:50]}..."


class Option(OrganizationModel):
    """Option model representing answer choices for questions."""
    
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.question.text[:30]}... - {self.text[:30]}..."