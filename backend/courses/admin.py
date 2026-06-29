from django.contrib import admin
from .models import Course, Module, Lesson, Topic, Material, TopicMaterial


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


@admin.register(TopicMaterial)
class TopicMaterialAdmin(admin.ModelAdmin):
    list_display = ['topic', 'organization', 'created_at']
    list_filter = ['organization', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'material_type', 'course', 'organization', 'order', 'slide_count', 'created_at']
    list_filter = ['organization', 'material_type', 'course', 'created_at']
    search_fields = ['title', 'description', 'content']
    filter_horizontal = ['modules', 'lessons', 'topics']
    ordering = ['order', 'created_at']