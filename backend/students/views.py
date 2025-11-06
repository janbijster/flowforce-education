from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import StudentGroup, Student, StudentQuestionAnswer
from .serializers import (
    StudentGroupSerializer, StudentGroupDetailSerializer,
    StudentSerializer, StudentDetailSerializer,
    StudentQuestionAnswerSerializer
)


class StudentGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentGroup model."""
    
    queryset = StudentGroup.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'year', 'created_at']
    ordering = ['year', 'name']
    filterset_fields = ['organization', 'course', 'modules', 'year']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentGroupDetailSerializer
        return StudentGroupSerializer
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students for this group."""
        group = self.get_object()
        students = Student.objects.filter(student_groups=group)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student model."""
    
    queryset = Student.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'first_name', 'created_at']
    ordering = ['last_name', 'first_name']
    filterset_fields = ['organization', 'student_groups']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer
    
    @action(detail=True, methods=['get'])
    def question_answers(self, request, pk=None):
        """Get all question answers for this student."""
        student = self.get_object()
        answers = StudentQuestionAnswer.objects.filter(student=student)
        serializer = StudentQuestionAnswerSerializer(answers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='group-progress/(?P<group_id>[^/.]+)')
    def group_progress(self, request, pk=None, group_id=None):
        """Get topic progress for a student in a specific student group."""
        from courses.models import Topic
        from .serializers import TopicProgressSerializer
        
        student = self.get_object()
        
        try:
            group = StudentGroup.objects.get(id=group_id, organization=student.organization)
        except StudentGroup.DoesNotExist:
            return Response({'detail': 'Student group not found'}, status=404)
        
        # Verify student is in this group
        if not student.student_groups.filter(id=group_id).exists():
            return Response({'detail': 'Student is not enrolled in this group'}, status=400)
        
        # Get all topics from the student group's modules
        modules = group.modules.all()
        topics = Topic.objects.filter(
            lesson__module__in=modules,
            organization=student.organization
        ).distinct().select_related('lesson', 'lesson__module', 'lesson__module__course')
        
        # Get all questions for these topics
        topic_ids = list(topics.values_list('id', flat=True))
        from quizzes.models import Question
        topic_questions = Question.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        )
        
        # Count total questions per topic
        from django.db.models import Count
        questions_per_topic = topic_questions.values('topic').annotate(
            total_count=Count('id')
        )
        total_questions_map = {item['topic']: item['total_count'] for item in questions_per_topic}
        
        # Get all student answers for questions in these topics
        student_answers = StudentQuestionAnswer.objects.filter(
            student=student,
            question__topic__in=topic_ids
        ).select_related('question__topic', 'answer')
        
        # Count answered questions per topic (total and correct)
        answered_questions_map = {}
        correct_questions_map = {}
        
        for answer in student_answers:
            topic_id = answer.question.topic.id
            if topic_id not in answered_questions_map:
                answered_questions_map[topic_id] = set()
            answered_questions_map[topic_id].add(answer.question.id)
            
            if answer.answer.is_correct:
                if topic_id not in correct_questions_map:
                    correct_questions_map[topic_id] = set()
                correct_questions_map[topic_id].add(answer.question.id)
        
        # Build topic progress data
        topics_data = []
        for topic in topics:
            total_questions = total_questions_map.get(topic.id, 0)
            questions_answered = len(answered_questions_map.get(topic.id, set()))
            questions_correct = len(correct_questions_map.get(topic.id, set()))
            
            topics_data.append({
                'id': topic.id,
                'name': topic.name,
                'description': topic.description or '',
                'lesson_name': topic.lesson.name,
                'module_name': topic.lesson.module.name,
                'course_name': topic.lesson.module.course.name,
                'questions_answered': questions_answered,
                'questions_correct': questions_correct,
                'total_questions': total_questions,
                'percentage': (questions_correct / questions_answered * 100) if questions_answered > 0 else 0
            })
        
        serializer = TopicProgressSerializer(topics_data, many=True)
        return Response(serializer.data)


class StudentQuestionAnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentQuestionAnswer model."""
    
    queryset = StudentQuestionAnswer.objects.all()
    serializer_class = StudentQuestionAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_fields = ['organization', 'student', 'question', 'quiz', 'answer']

