from django.db import models
from organizations.models import OrganizationModel


class Question(OrganizationModel):
    """Question model representing quiz questions."""
    
    text = models.TextField()
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
        ordering = ['created_at']
    
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