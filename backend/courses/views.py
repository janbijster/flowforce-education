from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, Module, Lesson, Topic, Material
from .serializers import (
    CourseSerializer, CourseDetailSerializer,
    ModuleSerializer, ModuleDetailSerializer,
    LessonSerializer, LessonDetailSerializer,
    TopicSerializer, TopicDetailSerializer,
    MaterialSerializer, MaterialDetailSerializer
)


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course model."""
    
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['organization']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        """Get all modules for this course."""
        course = self.get_object()
        modules = Module.objects.filter(course=course)
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


class ModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for Module model."""
    
    queryset = Module.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['organization', 'course']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ModuleDetailSerializer
        return ModuleSerializer
    
    @action(detail=True, methods=['get'])
    def lessons(self, request, pk=None):
        """Get all lessons for this module."""
        module = self.get_object()
        lessons = Lesson.objects.filter(module=module)
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)


class LessonViewSet(viewsets.ModelViewSet):
    """ViewSet for Lesson model."""
    
    queryset = Lesson.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['organization', 'module']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LessonDetailSerializer
        return LessonSerializer
    
    @action(detail=True, methods=['get'])
    def topics(self, request, pk=None):
        """Get all topics for this lesson."""
        lesson = self.get_object()
        topics = Topic.objects.filter(lesson=lesson)
        serializer = TopicSerializer(topics, many=True)
        return Response(serializer.data)


class TopicViewSet(viewsets.ModelViewSet):
    """ViewSet for Topic model."""
    
    queryset = Topic.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['organization', 'lesson']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TopicDetailSerializer
        return TopicSerializer
    
class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for Material model."""
    
    queryset = Material.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'content']
    ordering_fields = ['title', 'order', 'created_at', 'material_type']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'course', 'modules', 'lessons', 'topics', 'material_type']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MaterialDetailSerializer
        return MaterialSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for file URL generation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context