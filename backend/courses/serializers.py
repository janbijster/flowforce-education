from rest_framework import serializers
from .models import Course, Module, Lesson, Topic, LearningObjective


class LearningObjectiveSerializer(serializers.ModelSerializer):
    """Serializer for LearningObjective model."""
    
    topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningObjective
        fields = [
            'id', 'name', 'description', 'organization', 'topics',
            'topics_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_topics_count(self, obj):
        return obj.topics.count()


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model."""
    
    lesson_name = serializers.CharField(source='lesson.name', read_only=True)
    module_name = serializers.CharField(source='lesson.module.name', read_only=True)
    course_name = serializers.CharField(source='lesson.module.course.name', read_only=True)
    learning_objectives_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'description', 'organization', 'lesson',
            'lesson_name', 'module_name', 'course_name',
            'learning_objectives_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_learning_objectives_count(self, obj):
        return obj.learning_objectives.count()


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""
    
    module_name = serializers.CharField(source='module.name', read_only=True)
    course_name = serializers.CharField(source='module.course.name', read_only=True)
    topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'name', 'description', 'organization', 'module',
            'module_name', 'course_name', 'topics_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_topics_count(self, obj):
        return obj.topics.count()


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer for Module model."""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    lessons_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = [
            'id', 'name', 'description', 'organization', 'course',
            'course_name', 'lessons_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""
    
    modules_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'organization',
            'modules_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_modules_count(self, obj):
        return obj.modules.count()


# Detailed serializers with nested relationships
class TopicDetailSerializer(TopicSerializer):
    """Detailed serializer for Topic with learning objectives."""
    
    learning_objectives = LearningObjectiveSerializer(many=True, read_only=True)
    
    class Meta(TopicSerializer.Meta):
        fields = TopicSerializer.Meta.fields + ['learning_objectives']


class LessonDetailSerializer(LessonSerializer):
    """Detailed serializer for Lesson with topics."""
    
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + ['topics']


class ModuleDetailSerializer(ModuleSerializer):
    """Detailed serializer for Module with lessons."""
    
    lessons = LessonDetailSerializer(many=True, read_only=True)
    
    class Meta(ModuleSerializer.Meta):
        fields = ModuleSerializer.Meta.fields + ['lessons']


class CourseDetailSerializer(CourseSerializer):
    """Detailed serializer for Course with modules."""
    
    modules = ModuleDetailSerializer(many=True, read_only=True)
    
    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['modules']
