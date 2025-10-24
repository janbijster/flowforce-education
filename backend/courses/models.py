from django.db import models
from organizations.models import OrganizationModel


class Course(OrganizationModel):
    """Course model representing a collection of modules."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['organization', 'name']
    
    def __str__(self):
        return self.name


class Module(OrganizationModel):
    """Module model representing a collection of lessons within a course."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='modules'
    )
    
    class Meta:
        ordering = ['name']
        unique_together = ['organization', 'course', 'name']
    
    def __str__(self):
        return f"{self.course.name} - {self.name}"


class Lesson(OrganizationModel):
    """Lesson model representing a collection of topics within a module."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    
    class Meta:
        ordering = ['name']
        unique_together = ['organization', 'module', 'name']
    
    def __str__(self):
        return f"{self.module.course.name} - {self.module.name} - {self.name}"


class Topic(OrganizationModel):
    """Topic model representing a collection of learning objectives within a lesson."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='topics'
    )
    
    class Meta:
        ordering = ['name']
        unique_together = ['organization', 'lesson', 'name']
    
    def __str__(self):
        return f"{self.lesson.module.course.name} - {self.lesson.module.name} - {self.lesson.name} - {self.name}"


class LearningObjective(OrganizationModel):
    """Learning Objective model representing specific learning goals."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    topics = models.ManyToManyField(
        Topic,
        related_name='learning_objectives',
        blank=True
    )
    
    class Meta:
        ordering = ['name']
        unique_together = ['organization', 'name']
    
    def __str__(self):
        return self.name