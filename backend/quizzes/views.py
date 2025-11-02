from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Quiz, Question, Option
from .serializers import (
    QuizSerializer, QuizDetailSerializer,
    QuestionSerializer, QuestionDetailSerializer,
    OptionSerializer, OptionDetailSerializer
)


class QuizViewSet(viewsets.ModelViewSet):
    """ViewSet for Quiz model."""
    
    queryset = Quiz.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['created_at']
    filterset_fields = ['organization', 'course', 'module']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for this quiz."""
        quiz = self.get_object()
        questions = Question.objects.filter(quiz=quiz)
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder questions within this quiz.

        Expects JSON body: { "ordered_ids": [q1, q2, ...] }
        """
        quiz = self.get_object()
        ordered_ids = request.data.get('ordered_ids', [])
        if not isinstance(ordered_ids, list):
            return Response({"detail": "ordered_ids must be a list"}, status=400)
        # Assign incremental order based on provided list
        order_map = {int(qid): index for index, qid in enumerate(ordered_ids)}
        to_update = []
        for question in Question.objects.filter(quiz=quiz, id__in=order_map.keys()):
            new_order = order_map.get(question.id)
            if new_order is not None and question.order != new_order:
                question.order = new_order
                to_update.append(question)
        if to_update:
            Question.objects.bulk_update(to_update, ['order'])
        return Response({"updated": len(to_update)})


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for Question model."""
    
    queryset = Question.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'order']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives', 'quiz']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuestionDetailSerializer
        return QuestionSerializer
    
    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """Get all options for this question."""
        question = self.get_object()
        options = Option.objects.filter(question=question)
        serializer = OptionSerializer(options, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def correct_options(self, request, pk=None):
        """Get only correct options for this question."""
        question = self.get_object()
        options = Option.objects.filter(question=question, is_correct=True)
        serializer = OptionSerializer(options, many=True)
        return Response(serializer.data)


class OptionViewSet(viewsets.ModelViewSet):
    """ViewSet for Option model."""
    
    queryset = Option.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at']
    ordering = ['created_at']
    filterset_fields = ['organization', 'question', 'is_correct']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OptionDetailSerializer
        return OptionSerializer