from django.contrib import admin
from .models import Course, Module, Lesson, Topic, Material


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'organization', 'created_at']
    list_filter = ['organization', 'course', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['name', 'module', 'organization', 'created_at']
    list_filter = ['organization', 'module__course', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'lesson', 'organization', 'created_at']
    list_filter = ['organization', 'lesson__module__course', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'material_type', 'course', 'module', 'lesson', 'topic', 'organization', 'order', 'slide_count', 'created_at']
    list_filter = ['organization', 'material_type', 'course', 'module', 'lesson', 'topic', 'created_at']
    search_fields = ['title', 'description', 'content']
    ordering = ['order', 'created_at']