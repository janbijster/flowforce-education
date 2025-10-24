from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Question, Option
from .serializers import (
    QuestionSerializer, QuestionDetailSerializer,
    OptionSerializer, OptionDetailSerializer
)


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for Question model."""
    
    queryset = Question.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at']
    ordering = ['created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives']
    
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