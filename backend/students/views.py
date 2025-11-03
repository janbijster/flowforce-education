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


class StudentQuestionAnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentQuestionAnswer model."""
    
    queryset = StudentQuestionAnswer.objects.all()
    serializer_class = StudentQuestionAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_fields = ['organization', 'student', 'question', 'quiz', 'answer']

