from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuizViewSet,
    MultipleChoiceQuestionViewSet, OrderQuestionViewSet, ConnectQuestionViewSet,
    OptionViewSet, OrderOptionViewSet, ConnectOptionViewSet,
    ConnectOptionConnectionViewSet,
)

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet)
# Question type endpoints
# Register MultipleChoiceQuestionViewSet with 'questions' for backward compatibility
router.register(r'questions', MultipleChoiceQuestionViewSet, basename='question')
router.register(r'multiple-choice-questions', MultipleChoiceQuestionViewSet, basename='multiplechoicequestion')
router.register(r'order-questions', OrderQuestionViewSet)
router.register(r'connect-questions', ConnectQuestionViewSet)
# Option type endpoints
router.register(r'options', OptionViewSet)  # MultipleChoiceQuestion options
router.register(r'order-options', OrderOptionViewSet)
router.register(r'connect-options', ConnectOptionViewSet)
router.register(r'connect-option-connections', ConnectOptionConnectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
