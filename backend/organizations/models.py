from django.db import models
from django.contrib.auth.models import AbstractUser


class Organization(models.Model):
    """Organization model for multi-tenant architecture."""
    
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
        null=False,
        blank=True
    )
    
    class Meta:
        ordering = ['username']
    
    def __str__(self):
        org_name = self.organization.name if self.organization else "No Organization"
        return f"{self.username} ({org_name})"