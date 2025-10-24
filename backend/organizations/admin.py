from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'get_organization', 'is_staff']
    list_filter = ['organization', 'is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email', 'organization__name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Organization', {'fields': ('organization',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Organization', {'fields': ('organization',)}),
    )
    
    def get_organization(self, obj):
        return obj.organization.name if obj.organization else "No Organization"
    get_organization.short_description = 'Organization'