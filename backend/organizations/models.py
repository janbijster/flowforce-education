from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models


class TimestampedModel(models.Model):
    """Abstract base model that provides created_at and updated_at timestamps."""
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class OrganizationModel(TimestampedModel):
    """Abstract base model that provides timestamps and organization foreign key."""
    
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
    )
    
    class Meta:
        abstract = True


class Organization(TimestampedModel):
    """Organization model for multi-tenant architecture."""
    
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom User model linked to Organization."""
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    
    class Meta:
        ordering = ['username']
    
    def __str__(self):
        org_name = self.organization.name if self.organization else "No Organization"
        return f"{self.username} ({org_name})"