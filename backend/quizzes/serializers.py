from rest_framework import serializers
from .models import Question, Option


class OptionSerializer(serializers.ModelSerializer):
    """Serializer for Option model."""
    
    class Meta:
        model = Option
        fields = [
            'id', 'text', 'is_correct', 'organization', 'question',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model."""
    
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    lesson_name = serializers.CharField(source='topic.lesson.name', read_only=True)
    module_name = serializers.CharField(source='topic.lesson.module.name', read_only=True)
    course_name = serializers.CharField(source='topic.lesson.module.course.name', read_only=True)
    options_count = serializers.SerializerMethodField()
    learning_objectives_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = [
            'id', 'text', 'organization', 'topic', 'learning_objectives',
            'topic_name', 'lesson_name', 'module_name', 'course_name',
            'options_count', 'learning_objectives_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_options_count(self, obj):
        return obj.options.count()
    
    def get_learning_objectives_count(self, obj):
        return obj.learning_objectives.count()


class QuestionDetailSerializer(QuestionSerializer):
    """Detailed serializer for Question with options."""
    
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ['options']


class OptionDetailSerializer(OptionSerializer):
    """Detailed serializer for Option with question details."""
    
    question_text = serializers.CharField(source='question.text', read_only=True)
    topic_name = serializers.CharField(source='question.topic.name', read_only=True)
    course_name = serializers.CharField(source='question.topic.lesson.module.course.name', read_only=True)
    
    class Meta(OptionSerializer.Meta):
        fields = OptionSerializer.Meta.fields + ['question_text', 'topic_name', 'course_name']
