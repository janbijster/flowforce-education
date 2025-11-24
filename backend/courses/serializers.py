from rest_framework import serializers
from .models import Course, Module, Lesson, Topic, Material


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model."""
    
    lesson_name = serializers.CharField(source='lesson.name', read_only=True)
    module_name = serializers.CharField(source='lesson.module.name', read_only=True)
    course_name = serializers.CharField(source='lesson.module.course.name', read_only=True)
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'description', 'organization', 'lesson',
            'lesson_name', 'module_name', 'course_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    """Detailed serializer for Topic (same as base since learning objectives are now Topics)."""
    
    class Meta(TopicSerializer.Meta):
        fields = TopicSerializer.Meta.fields


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


# Learning Materials Serializers
class MaterialSerializer(serializers.ModelSerializer):
    """Serializer for Material model."""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    modules_names = serializers.SerializerMethodField()
    lessons_names = serializers.SerializerMethodField()
    topics_names = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Material
        fields = [
            'id', 'title', 'description', 'order', 'material_type',
            'organization', 'course', 'modules', 'lessons', 'topics',
            'course_name', 'modules_names', 'lessons_names', 'topics_names',
            'file', 'file_url', 'content', 'slide_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_modules_names(self, obj):
        return [m.name for m in obj.modules.all()]
    
    def get_lessons_names(self, obj):
        return [l.name for l in obj.lessons.all()]
    
    def get_topics_names(self, obj):
        return [t.name for t in obj.topics.all()]
    
    def get_file_url(self, obj):
        """Return the file URL if file exists."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def validate(self, data):
        """Validate that at least one course hierarchy level is specified."""
        has_course = data.get('course') is not None
        has_modules = data.get('modules') and len(data.get('modules', [])) > 0
        has_lessons = data.get('lessons') and len(data.get('lessons', [])) > 0
        has_topics = data.get('topics') and len(data.get('topics', [])) > 0
        
        if not any([has_course, has_modules, has_lessons, has_topics]):
            raise serializers.ValidationError(
                'At least one of course, modules, lessons, or topics must be specified.'
            )
        return data


class MaterialDetailSerializer(MaterialSerializer):
    """Detailed serializer for Material (same as base)."""
    
    class Meta(MaterialSerializer.Meta):
        fields = MaterialSerializer.Meta.fields
