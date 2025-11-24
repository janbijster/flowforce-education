from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, ModuleViewSet, LessonViewSet,
    TopicViewSet, MaterialViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'materials', MaterialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
