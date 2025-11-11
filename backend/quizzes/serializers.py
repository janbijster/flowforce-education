from rest_framework import serializers
from .models import (
    Quiz, 
    MultipleChoiceQuestion, OrderQuestion, ConnectQuestion, NumberQuestion,
    Option, OrderOption, ConnectOption, ConnectOptionConnection
)

# Backward compatibility
Question = MultipleChoiceQuestion


class OptionSerializer(serializers.ModelSerializer):
    """Serializer for Option model (MultipleChoiceQuestion)."""
    
    class Meta:
        model = Option
        fields = [
            'id', 'text', 'is_correct', 'image', 'hide_text', 'organization', 'question',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderOptionSerializer(serializers.ModelSerializer):
    """Serializer for OrderOption model."""
    
    class Meta:
        model = OrderOption
        fields = [
            'id', 'text', 'image', 'hide_text', 'correct_order', 'organization', 'question',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConnectOptionSerializer(serializers.ModelSerializer):
    """Serializer for ConnectOption model."""
    
    class Meta:
        model = ConnectOption
        fields = [
            'id', 'text', 'image', 'hide_text', 'position_x', 'position_y', 'width', 'height', 'organization', 'question',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConnectOptionConnectionSerializer(serializers.ModelSerializer):
    """Serializer for ConnectOptionConnection model."""
    
    from_option_text = serializers.CharField(source='from_option.text', read_only=True)
    to_option_text = serializers.CharField(source='to_option.text', read_only=True)
    
    class Meta:
        model = ConnectOptionConnection
        fields = [
            'id', 'question', 'from_option', 'to_option', 'from_option_text', 'to_option_text',
            'organization', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BaseQuestionSerializer(serializers.ModelSerializer):
    """Base serializer for all question types."""
    
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    lesson_name = serializers.CharField(source='topic.lesson.name', read_only=True)
    module_name = serializers.CharField(source='topic.lesson.module.name', read_only=True)
    course_name = serializers.CharField(source='topic.lesson.module.course.name', read_only=True)
    learning_objectives_count = serializers.SerializerMethodField()
    
    class Meta:
        fields = [
            'id', 'text', 'order', 'question_type', 'image', 'video', 'hide_text',
            'organization', 'quiz', 'topic', 'learning_objectives',
            'quiz_name', 'topic_name', 'lesson_name', 'module_name', 'course_name',
            'learning_objectives_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'question_type', 'created_at', 'updated_at']
    
    def get_learning_objectives_count(self, obj):
        return obj.learning_objectives.count()


class MultipleChoiceQuestionSerializer(BaseQuestionSerializer):
    """Serializer for MultipleChoiceQuestion model."""
    
    options_count = serializers.SerializerMethodField()
    
    class Meta(BaseQuestionSerializer.Meta):
        model = MultipleChoiceQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['options_count']
    
    def get_options_count(self, obj):
        return obj.options.count()


class MultipleChoiceQuestionDetailSerializer(MultipleChoiceQuestionSerializer):
    """Detailed serializer for MultipleChoiceQuestion with options."""
    
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta(MultipleChoiceQuestionSerializer.Meta):
        fields = MultipleChoiceQuestionSerializer.Meta.fields + ['options']


class OrderQuestionSerializer(BaseQuestionSerializer):
    """Serializer for OrderQuestion model."""
    
    order_options_count = serializers.SerializerMethodField()
    
    class Meta(BaseQuestionSerializer.Meta):
        model = OrderQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['order_options_count']
    
    def get_order_options_count(self, obj):
        return obj.order_options.count()


class OrderQuestionDetailSerializer(OrderQuestionSerializer):
    """Detailed serializer for OrderQuestion with order options."""
    
    order_options = OrderOptionSerializer(many=True, read_only=True)
    
    class Meta(OrderQuestionSerializer.Meta):
        fields = OrderQuestionSerializer.Meta.fields + ['order_options']


class ConnectQuestionSerializer(BaseQuestionSerializer):
    """Serializer for ConnectQuestion model."""
    
    connect_options_count = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    
    class Meta(BaseQuestionSerializer.Meta):
        model = ConnectQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['connect_options_count', 'connections_count']
    
    def get_connect_options_count(self, obj):
        return obj.connect_options.count()
    
    def get_connections_count(self, obj):
        return obj.correct_connections.count()


class ConnectQuestionDetailSerializer(ConnectQuestionSerializer):
    """Detailed serializer for ConnectQuestion with connect options and connections."""
    
    connect_options = ConnectOptionSerializer(many=True, read_only=True)
    correct_connections = ConnectOptionConnectionSerializer(many=True, read_only=True)
    
    class Meta(ConnectQuestionSerializer.Meta):
        fields = ConnectQuestionSerializer.Meta.fields + ['connect_options', 'correct_connections']


class NumberQuestionSerializer(BaseQuestionSerializer):
    """Serializer for NumberQuestion model."""
    
    class Meta(BaseQuestionSerializer.Meta):
        model = NumberQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['correct_answer', 'tolerance']


class NumberQuestionDetailSerializer(NumberQuestionSerializer):
    """Detailed serializer for NumberQuestion (same as base since it has no nested objects)."""
    
    class Meta(NumberQuestionSerializer.Meta):
        fields = NumberQuestionSerializer.Meta.fields


# Backward compatibility aliases
QuestionSerializer = MultipleChoiceQuestionSerializer
QuestionDetailSerializer = MultipleChoiceQuestionDetailSerializer


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for Quiz model."""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    module_name = serializers.CharField(source='module.name', read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'name', 'description', 'organization', 'course', 'module',
            'lessons', 'topics', 'course_name', 'module_name',
            'questions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_questions_count(self, obj):
        """Get total count of all question types."""
        return (
            obj.multiplechoicequestion_questions.count() +
            obj.orderquestion_questions.count() +
            obj.connectquestion_questions.count() +
            obj.numberquestion_questions.count()
        )


class QuizDetailSerializer(QuizSerializer):
    """Detailed serializer for Quiz with all question types."""
    
    multiple_choice_questions = MultipleChoiceQuestionSerializer(
        source='multiplechoicequestion_questions', many=True, read_only=True
    )
    order_questions = OrderQuestionSerializer(
        source='orderquestion_questions', many=True, read_only=True
    )
    connect_questions = ConnectQuestionSerializer(
        source='connectquestion_questions', many=True, read_only=True
    )
    number_questions = NumberQuestionSerializer(
        source='numberquestion_questions', many=True, read_only=True
    )
    
    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + [
            'multiple_choice_questions', 'order_questions', 'connect_questions', 'number_questions'
        ]


class OptionDetailSerializer(OptionSerializer):
    """Detailed serializer for Option with question details."""
    
    question_text = serializers.CharField(source='question.text', read_only=True)
    topic_name = serializers.CharField(source='question.topic.name', read_only=True)
    course_name = serializers.CharField(source='question.topic.lesson.module.course.name', read_only=True)
    
    class Meta(OptionSerializer.Meta):
        fields = OptionSerializer.Meta.fields + ['question_text', 'topic_name', 'course_name']


class OrderOptionDetailSerializer(OrderOptionSerializer):
    """Detailed serializer for OrderOption with question details."""
    
    question_text = serializers.CharField(source='question.text', read_only=True)
    topic_name = serializers.CharField(source='question.topic.name', read_only=True)
    course_name = serializers.CharField(source='question.topic.lesson.module.course.name', read_only=True)
    
    class Meta(OrderOptionSerializer.Meta):
        fields = OrderOptionSerializer.Meta.fields + ['question_text', 'topic_name', 'course_name']


class ConnectOptionDetailSerializer(ConnectOptionSerializer):
    """Detailed serializer for ConnectOption with question details."""
    
    question_text = serializers.CharField(source='question.text', read_only=True)
    topic_name = serializers.CharField(source='question.topic.name', read_only=True)
    course_name = serializers.CharField(source='question.topic.lesson.module.course.name', read_only=True)
    
    class Meta(ConnectOptionSerializer.Meta):
        fields = ConnectOptionSerializer.Meta.fields + ['question_text', 'topic_name', 'course_name']
