from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentGroupViewSet, StudentViewSet, StudentQuestionAnswerViewSet

router = DefaultRouter()
router.register(r'student-groups', StudentGroupViewSet)
router.register(r'students', StudentViewSet)
router.register(r'student-question-answers', StudentQuestionAnswerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

