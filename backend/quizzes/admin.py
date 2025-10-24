from django.contrib import admin
from .models import Question, Option


class OptionInline(admin.TabularInline):
    model = Option
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'topic', 'organization', 'created_at']
    list_filter = ['organization', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']
    filter_horizontal = ['learning_objectives']
    inlines = [OptionInline]


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'is_correct', 'organization', 'created_at']
    list_filter = ['organization', 'is_correct', 'created_at']
    search_fields = ['text']