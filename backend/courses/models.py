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


class Material(OrganizationModel):
    """Material model for learning materials (readers, presentations, etc.)."""
    
    MATERIAL_TYPE_CHOICES = [
        ('reader', 'Reader'),
        ('presentation', 'Presentation'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    material_type = models.CharField(
        max_length=20,
        choices=MATERIAL_TYPE_CHOICES,
        db_index=True
    )
    
    # Materials can be linked to different levels of the course hierarchy
    # At least one should be specified
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='materials',
        null=True,
        blank=True
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='materials',
        null=True,
        blank=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='materials',
        null=True,
        blank=True
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='materials',
        null=True,
        blank=True
    )
    
    # Link to learning objectives
    learning_objectives = models.ManyToManyField(
        LearningObjective,
        related_name='materials',
        blank=True
    )
    
    # File upload (for both readers and presentations)
    file = models.FileField(
        upload_to='materials/',
        blank=True,
        null=True,
        help_text="Upload a file (PDF, DOCX, PPTX, etc.)"
    )
    
    # Optional: Rich text content (primarily for readers)
    content = models.TextField(
        blank=True,
        help_text="Rich text content (HTML or Markdown)"
    )
    
    # Optional: Number of slides (primarily for presentations)
    slide_count = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Number of slides in the presentation"
    )
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def clean(self):
        """Validate that at least one course hierarchy level is specified."""
        from django.core.exceptions import ValidationError
        if not any([self.course, self.module, self.lesson, self.topic]):
            raise ValidationError('At least one of course, module, lesson, or topic must be specified.')
    
    def save(self, *args, **kwargs):
        """Validate before saving."""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        location = []
        if self.topic:
            location.append(self.topic.name)
        if self.lesson:
            location.append(self.lesson.name)
        if self.module:
            location.append(self.module.name)
        if self.course:
            location.append(self.course.name)
        location_str = ' - '.join(reversed(location)) if location else 'Unassigned'
        return f"{location_str} - {self.title}"