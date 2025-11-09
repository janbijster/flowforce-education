from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
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
        
        # Get all questions for these topics (all question types)
        topic_ids = list(topics.values_list('id', flat=True))
        from quizzes.models import MultipleChoiceQuestion, OrderQuestion, ConnectQuestion
        from django.db.models import Count
        
        # Count questions per topic across all question types
        mcq_per_topic = MultipleChoiceQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values('topic').annotate(total_count=Count('id'))
        
        order_per_topic = OrderQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values('topic').annotate(total_count=Count('id'))
        
        connect_per_topic = ConnectQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values('topic').annotate(total_count=Count('id'))
        
        # Combine counts
        total_questions_map = {}
        for item in mcq_per_topic:
            total_questions_map[item['topic']] = total_questions_map.get(item['topic'], 0) + item['total_count']
        for item in order_per_topic:
            total_questions_map[item['topic']] = total_questions_map.get(item['topic'], 0) + item['total_count']
        for item in connect_per_topic:
            total_questions_map[item['topic']] = total_questions_map.get(item['topic'], 0) + item['total_count']
        
        # Get all student answers for questions in these topics
        # Note: We can't filter directly on GenericForeignKey, so we need to get question IDs first
        from django.contrib.contenttypes.models import ContentType
        
        # Get ContentTypes for all question types
        mcq_ct = ContentType.objects.get_for_model(MultipleChoiceQuestion)
        order_ct = ContentType.objects.get_for_model(OrderQuestion)
        connect_ct = ContentType.objects.get_for_model(ConnectQuestion)
        
        # Get question IDs from all question types in these topics
        mcq_ids = MultipleChoiceQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values_list('id', flat=True)
        order_ids = OrderQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values_list('id', flat=True)
        connect_ids = ConnectQuestion.objects.filter(
            topic__in=topic_ids,
            organization=student.organization
        ).values_list('id', flat=True)
        
        # Build list of (content_type_id, question_id) tuples
        question_refs = (
            [(mcq_ct.id, qid) for qid in mcq_ids] +
            [(order_ct.id, qid) for qid in order_ids] +
            [(connect_ct.id, qid) for qid in connect_ids]
        )
        
        # Filter StudentQuestionAnswer by content_type and question_id pairs
        from django.db.models import Q
        q_objects = Q()
        for ct_id, q_id in question_refs:
            q_objects |= Q(question_content_type_id=ct_id, question_id=q_id)
        
        student_answers = StudentQuestionAnswer.objects.filter(
            student=student
        ).filter(q_objects).select_related('answer')
        
        # Count answered questions per topic (total and correct)
        answered_questions_map = {}
        correct_questions_map = {}
        
        # Build a map of (content_type_id, question_id) -> topic_id for quick lookup
        question_to_topic = {}
        
        # Get all questions in bulk and map to topics
        if mcq_ids:
            mcq_questions = MultipleChoiceQuestion.objects.filter(id__in=mcq_ids).values('id', 'topic_id')
            for q in mcq_questions:
                question_to_topic[(mcq_ct.id, q['id'])] = q['topic_id']
        
        if order_ids:
            order_questions = OrderQuestion.objects.filter(id__in=order_ids).values('id', 'topic_id')
            for q in order_questions:
                question_to_topic[(order_ct.id, q['id'])] = q['topic_id']
        
        if connect_ids:
            connect_questions = ConnectQuestion.objects.filter(id__in=connect_ids).values('id', 'topic_id')
            for q in connect_questions:
                question_to_topic[(connect_ct.id, q['id'])] = q['topic_id']
        
        for answer in student_answers:
            key = (answer.question_content_type_id, answer.question_id)
            topic_id = question_to_topic.get(key)
            if topic_id:
                if topic_id not in answered_questions_map:
                    answered_questions_map[topic_id] = set()
                answered_questions_map[topic_id].add(answer.question_id)
                
                # Check if correct (only for MultipleChoiceQuestion with answer field)
                if answer.answer and answer.answer.is_correct:
                    if topic_id not in correct_questions_map:
                        correct_questions_map[topic_id] = set()
                    correct_questions_map[topic_id].add(answer.question_id)
                # For OrderQuestion and ConnectQuestion, use the correct property
                elif answer.answer is None and answer.correct:
                    if topic_id not in correct_questions_map:
                        correct_questions_map[topic_id] = set()
                    correct_questions_map[topic_id].add(answer.question_id)
        
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


class StudentQuestionAnswerFilterSet(django_filters.FilterSet):
    """Custom FilterSet for StudentQuestionAnswer that handles GenericForeignKey."""
    
    # Filter by question_id and question_content_type separately
    question_id = django_filters.NumberFilter(field_name='question_id')
    question_content_type = django_filters.NumberFilter(field_name='question_content_type')
    
    class Meta:
        model = StudentQuestionAnswer
        fields = ['organization', 'student', 'quiz', 'answer', 'question_id', 'question_content_type']


class StudentQuestionAnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentQuestionAnswer model."""
    
    queryset = StudentQuestionAnswer.objects.all()
    serializer_class = StudentQuestionAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_class = StudentQuestionAnswerFilterSet

