from django.db import models
from organizations.models import OrganizationModel


class StudentGroup(OrganizationModel):
    """StudentGroup model representing a group of students enrolled in a course."""
    
    name = models.CharField(max_length=255)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='student_groups'
    )
    module = models.ForeignKey(
        'courses.Module',
        on_delete=models.CASCADE,
        related_name='student_groups',
        null=True,
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
    
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    student_group = models.ForeignKey(
        StudentGroup,
        on_delete=models.CASCADE,
        related_name='students'
    )
    
    class Meta:
        ordering = ['last_name', 'first_name']
        unique_together = ['organization', 'student_group', 'first_name', 'last_name', 'email']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_group.name})"


class StudentQuestionAnswer(OrganizationModel):
    """StudentQuestionAnswer model tracking student answers to quiz questions."""
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='question_answers'
    )
    question = models.ForeignKey(
        'quizzes.Question',
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    quiz = models.ForeignKey(
        'quizzes.Quiz',
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    answer = models.ForeignKey(
        'quizzes.Option',
        on_delete=models.CASCADE,
        related_name='student_selections'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['organization', 'student', 'question', 'quiz']
    
    def __str__(self):
        return f"{self.student} - {self.question.text[:50]}..."
    
    @property
    def correct(self):
        """Dynamic property that checks if the answered option was correct."""
        return self.answer.is_correct

