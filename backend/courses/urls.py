from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, ModuleViewSet, LessonViewSet,
    TopicViewSet, LearningObjectiveViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'learning-objectives', LearningObjectiveViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
