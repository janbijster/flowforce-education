from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Quiz,
    MultipleChoiceQuestion, OrderQuestion, ConnectQuestion, NumberQuestion,
    Option, OrderOption, ConnectOption, ConnectOptionConnection
)
from .serializers import (
    QuizSerializer, QuizDetailSerializer,
    MultipleChoiceQuestionSerializer, MultipleChoiceQuestionDetailSerializer,
    OrderQuestionSerializer, OrderQuestionDetailSerializer,
    ConnectQuestionSerializer, ConnectQuestionDetailSerializer,
    NumberQuestionSerializer, NumberQuestionDetailSerializer,
    OptionSerializer, OptionDetailSerializer,
    OrderOptionSerializer, OrderOptionDetailSerializer,
    ConnectOptionSerializer, ConnectOptionDetailSerializer,
    ConnectOptionConnectionSerializer,
    # Backward compatibility
    QuestionSerializer, QuestionDetailSerializer
)

# Backward compatibility
Question = MultipleChoiceQuestion


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
        """Get all questions for this quiz (all types)."""
        quiz = self.get_object()
        
        # Get all question types using the related_name
        mc_questions = quiz.multiplechoicequestion_questions.all()
        order_questions = quiz.orderquestion_questions.all()
        connect_questions = quiz.connectquestion_questions.all()
        number_questions = quiz.numberquestion_questions.all()
        
        # Serialize each type
        mc_data = MultipleChoiceQuestionSerializer(mc_questions, many=True).data
        order_data = OrderQuestionSerializer(order_questions, many=True).data
        connect_data = ConnectQuestionSerializer(connect_questions, many=True).data
        number_data = NumberQuestionSerializer(number_questions, many=True).data
        
        return Response({
            'multiple_choice': mc_data,
            'order': order_data,
            'connect': connect_data,
            'number': number_data
        })

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder questions within this quiz (all types).

        Expects JSON body: { "ordered_ids": [q1, q2, ...] }
        Works across all question types.
        """
        quiz = self.get_object()
        ordered_ids = request.data.get('ordered_ids', [])
        if not isinstance(ordered_ids, list):
            return Response({"detail": "ordered_ids must be a list"}, status=400)
        
        # Assign incremental order based on provided list
        order_map = {int(qid): index for index, qid in enumerate(ordered_ids)}
        to_update = []
        
        # Update MultipleChoiceQuestions
        for question in quiz.multiplechoicequestion_questions.filter(id__in=order_map.keys()):
            new_order = order_map.get(question.id)
            if new_order is not None and question.order != new_order:
                question.order = new_order
                to_update.append(question)
        
        # Update OrderQuestions
        for question in quiz.orderquestion_questions.filter(id__in=order_map.keys()):
            new_order = order_map.get(question.id)
            if new_order is not None and question.order != new_order:
                question.order = new_order
                to_update.append(question)
        
        # Update ConnectQuestions
        for question in quiz.connectquestion_questions.filter(id__in=order_map.keys()):
            new_order = order_map.get(question.id)
            if new_order is not None and question.order != new_order:
                question.order = new_order
                to_update.append(question)
        
        # Update NumberQuestions
        for question in quiz.numberquestion_questions.filter(id__in=order_map.keys()):
            new_order = order_map.get(question.id)
            if new_order is not None and question.order != new_order:
                question.order = new_order
                to_update.append(question)
        
        if to_update:
            # Separate by type for bulk update
            mc_to_update = [q for q in to_update if q.__class__ == MultipleChoiceQuestion]
            order_to_update = [q for q in to_update if q.__class__ == OrderQuestion]
            connect_to_update = [q for q in to_update if q.__class__ == ConnectQuestion]
            number_to_update = [q for q in to_update if q.__class__ == NumberQuestion]
            
            if mc_to_update:
                MultipleChoiceQuestion.objects.bulk_update(mc_to_update, ['order'])
            if order_to_update:
                OrderQuestion.objects.bulk_update(order_to_update, ['order'])
            if connect_to_update:
                ConnectQuestion.objects.bulk_update(connect_to_update, ['order'])
            if number_to_update:
                NumberQuestion.objects.bulk_update(number_to_update, ['order'])
        
        return Response({"updated": len(to_update)})


class MultipleChoiceQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for MultipleChoiceQuestion model."""
    
    queryset = MultipleChoiceQuestion.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'order']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives', 'quiz']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MultipleChoiceQuestionDetailSerializer
        return MultipleChoiceQuestionSerializer
    
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


# Backward compatibility alias
QuestionViewSet = MultipleChoiceQuestionViewSet


class OrderQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for OrderQuestion model."""
    
    queryset = OrderQuestion.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'order']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives', 'quiz']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderQuestionDetailSerializer
        return OrderQuestionSerializer
    
    @action(detail=True, methods=['get'])
    def order_options(self, request, pk=None):
        """Get all order options for this question."""
        question = self.get_object()
        options = OrderOption.objects.filter(question=question)
        serializer = OrderOptionSerializer(options, many=True)
        return Response(serializer.data)


class ConnectQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for ConnectQuestion model."""
    
    queryset = ConnectQuestion.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'order']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives', 'quiz']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConnectQuestionDetailSerializer
        return ConnectQuestionSerializer
    
    @action(detail=True, methods=['get'])
    def connect_options(self, request, pk=None):
        """Get all connect options for this question."""
        question = self.get_object()
        options = ConnectOption.objects.filter(question=question)
        serializer = ConnectOptionSerializer(options, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def connections(self, request, pk=None):
        """Get all correct connections for this question."""
        question = self.get_object()
        connections = ConnectOptionConnection.objects.filter(question=question)
        serializer = ConnectOptionConnectionSerializer(connections, many=True)
        return Response(serializer.data)


class OptionViewSet(viewsets.ModelViewSet):
    """ViewSet for Option model (MultipleChoiceQuestion)."""
    
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


class OrderOptionViewSet(viewsets.ModelViewSet):
    """ViewSet for OrderOption model."""
    
    queryset = OrderOption.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'correct_order', 'created_at']
    ordering = ['correct_order', 'created_at']
    filterset_fields = ['organization', 'question']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderOptionDetailSerializer
        return OrderOptionSerializer


class ConnectOptionViewSet(viewsets.ModelViewSet):
    """ViewSet for ConnectOption model."""
    
    queryset = ConnectOption.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at']
    ordering = ['created_at']
    filterset_fields = ['organization', 'question']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConnectOptionDetailSerializer
        return ConnectOptionSerializer


class ConnectOptionConnectionViewSet(viewsets.ModelViewSet):
    """ViewSet for ConnectOptionConnection model."""
    
    queryset = ConnectOptionConnection.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['from_option__text', 'to_option__text']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    filterset_fields = ['organization', 'question', 'from_option', 'to_option']
    
    def get_serializer_class(self):
        return ConnectOptionConnectionSerializer


class NumberQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for NumberQuestion model."""
    
    queryset = NumberQuestion.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'order']
    ordering = ['order', 'created_at']
    filterset_fields = ['organization', 'topic', 'learning_objectives', 'quiz']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NumberQuestionDetailSerializer
        return NumberQuestionSerializer