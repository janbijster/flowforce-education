from django.contrib import admin
from .models import (
    Quiz, 
    MultipleChoiceQuestion, OrderQuestion, ConnectQuestion, NumberQuestion,
    Option, OrderOption, ConnectOption, ConnectOptionConnection
)

# Backward compatibility
Question = MultipleChoiceQuestion


class MultipleChoiceQuestionInline(admin.TabularInline):
    model = MultipleChoiceQuestion
    extra = 1
    fields = ['text', 'order', 'topic', 'image', 'video']


class OrderQuestionInline(admin.TabularInline):
    model = OrderQuestion
    extra = 1
    fields = ['text', 'order', 'topic', 'image', 'video']


class ConnectQuestionInline(admin.TabularInline):
    model = ConnectQuestion
    extra = 1
    fields = ['text', 'order', 'topic', 'image', 'video']


class NumberQuestionInline(admin.TabularInline):
    model = NumberQuestion
    extra = 1
    fields = ['text', 'order', 'topic', 'image', 'video', 'correct_answer', 'tolerance']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'module', 'organization', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['lessons', 'topics']
    inlines = [MultipleChoiceQuestionInline, OrderQuestionInline, ConnectQuestionInline, NumberQuestionInline]


class OptionInline(admin.TabularInline):
    model = Option
    extra = 4
    fields = ['text', 'is_correct', 'image']


@admin.register(MultipleChoiceQuestion)
class MultipleChoiceQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question_type', 'topic', 'organization', 'order', 'created_at']
    list_filter = ['organization', 'question_type', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']
    filter_horizontal = ['learning_objectives']
    inlines = [OptionInline]
    readonly_fields = ['question_type']
    fields = ['organization', 'text', 'question_type', 'image', 'video', 'order', 'quiz', 'topic', 'learning_objectives']


class OrderOptionInline(admin.TabularInline):
    model = OrderOption
    extra = 4
    fields = ['text', 'image', 'correct_order']


@admin.register(OrderQuestion)
class OrderQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question_type', 'topic', 'organization', 'order', 'created_at']
    list_filter = ['organization', 'question_type', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']
    filter_horizontal = ['learning_objectives']
    inlines = [OrderOptionInline]
    readonly_fields = ['question_type']
    fields = ['organization', 'text', 'question_type', 'image', 'video', 'order', 'quiz', 'topic', 'learning_objectives']


class ConnectOptionInline(admin.TabularInline):
    model = ConnectOption
    extra = 4
    fields = ['text', 'image', 'position_x', 'position_y']


class ConnectOptionConnectionInline(admin.TabularInline):
    model = ConnectOptionConnection
    extra = 2
    fields = ['from_option', 'to_option']


@admin.register(ConnectQuestion)
class ConnectQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question_type', 'topic', 'organization', 'order', 'created_at']
    list_filter = ['organization', 'question_type', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']
    filter_horizontal = ['learning_objectives']
    inlines = [ConnectOptionInline, ConnectOptionConnectionInline]
    readonly_fields = ['question_type']
    fields = ['organization', 'text', 'question_type', 'image', 'video', 'order', 'quiz', 'topic', 'learning_objectives']


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'is_correct', 'organization', 'created_at']
    list_filter = ['organization', 'is_correct', 'created_at']
    search_fields = ['text']


@admin.register(OrderOption)
class OrderOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'correct_order', 'organization', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['text']


@admin.register(ConnectOption)
class ConnectOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'position_x', 'position_y', 'organization', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['text']


@admin.register(ConnectOptionConnection)
class ConnectOptionConnectionAdmin(admin.ModelAdmin):
    list_display = ['question', 'from_option', 'to_option', 'organization', 'created_at']
    list_filter = ['organization', 'question', 'created_at']


@admin.register(NumberQuestion)
class NumberQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question_type', 'topic', 'correct_answer', 'tolerance', 'organization', 'order', 'created_at']
    list_filter = ['organization', 'question_type', 'topic__lesson__module__course', 'created_at']
    search_fields = ['text']
    filter_horizontal = ['learning_objectives']
    readonly_fields = ['question_type']
    fields = ['organization', 'text', 'question_type', 'image', 'video', 'hide_text', 'order', 'quiz', 'topic', 'learning_objectives', 'correct_answer', 'tolerance']