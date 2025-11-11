from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentGroup, Student, StudentQuestionAnswer

User = get_user_model()


class StudentGroupSerializer(serializers.ModelSerializer):
    """Serializer for StudentGroup model."""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    modules_names = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    course_name_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGroup
        fields = [
            'id', 'name', 'organization', 'course', 'modules', 'year',
            'course_name', 'modules_names', 'course_name_display', 'students_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_students_count(self, obj):
        return obj.students.count()
    
    def get_course_name_display(self, obj):
        """Return course name for display purposes."""
        return obj.course.name
    
    def get_modules_names(self, obj):
        return [m.name for m in obj.modules.all()]


class StudentGroupDetailSerializer(StudentGroupSerializer):
    """Detailed serializer for StudentGroup with students."""
    
    students = serializers.SerializerMethodField()
    
    class Meta(StudentGroupSerializer.Meta):
        fields = StudentGroupSerializer.Meta.fields + ['students']
    
    def get_students(self, obj):
        from courses.models import Topic
        from django.contrib.contenttypes.models import ContentType
        from quizzes.models import MultipleChoiceQuestion, OrderQuestion, ConnectQuestion, NumberQuestion
        
        students = obj.students.all()
        
        # Get all topics from the student group's modules
        modules = obj.modules.all()
        topics = Topic.objects.filter(
            lesson__module__in=modules,
            organization=obj.organization
        ).distinct()
        total_topics = topics.count()
        
        # Get all correct answers for students in this group
        # Note: We can only select_related on regular ForeignKeys, not GenericForeignKeys
        topic_ids = list(topics.values_list('id', flat=True))
        
        # Get ContentTypes for question types
        mcq_ct = ContentType.objects.get_for_model(MultipleChoiceQuestion)
        order_ct = ContentType.objects.get_for_model(OrderQuestion)
        connect_ct = ContentType.objects.get_for_model(ConnectQuestion)
        number_ct = ContentType.objects.get_for_model(NumberQuestion)
        
        # Get question IDs from all question types in these topics
        mcq_ids = MultipleChoiceQuestion.objects.filter(
            topic__in=topic_ids,
            organization=obj.organization
        ).values_list('id', flat=True)
        order_ids = OrderQuestion.objects.filter(
            topic__in=topic_ids,
            organization=obj.organization
        ).values_list('id', flat=True)
        connect_ids = ConnectQuestion.objects.filter(
            topic__in=topic_ids,
            organization=obj.organization
        ).values_list('id', flat=True)
        number_ids = NumberQuestion.objects.filter(
            topic__in=topic_ids,
            organization=obj.organization
        ).values_list('id', flat=True)
        
        # Build list of (content_type_id, question_id) tuples
        question_refs = (
            [(mcq_ct.id, qid) for qid in mcq_ids] +
            [(order_ct.id, qid) for qid in order_ids] +
            [(connect_ct.id, qid) for qid in connect_ids] +
            [(number_ct.id, qid) for qid in number_ids]
        )
        
        # Filter StudentQuestionAnswer by content_type and question_id pairs
        from django.db.models import Q
        q_objects = Q()
        for ct_id, q_id in question_refs:
            q_objects |= Q(question_content_type_id=ct_id, question_id=q_id)
        
        # Get all answers (we'll filter for correct ones in Python since we need to check the 'correct' property)
        all_answers = StudentQuestionAnswer.objects.filter(
            student__in=students
        ).filter(q_objects).select_related('answer', 'question_content_type')
        
        # Build a map of (content_type_id, question_id) -> topic_id
        question_to_topic = {}
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
        if number_ids:
            number_questions = NumberQuestion.objects.filter(id__in=number_ids).values('id', 'topic_id')
            for q in number_questions:
                question_to_topic[(number_ct.id, q['id'])] = q['topic_id']
        
        # Create a map of student -> set of topics with correct answers
        # Build set of valid ContentType IDs
        valid_ct_ids = {mcq_ct.id, order_ct.id, connect_ct.id, number_ct.id}
        
        student_mastered_topics = {}
        for answer in all_answers:
            # Check if answer is correct
            # Only process if we have valid content_type and question_id
            if not answer.question_content_type_id or not answer.question_id:
                continue
            
            # Only process if ContentType is one of our known question types
            if answer.question_content_type_id not in valid_ct_ids:
                continue
            
            is_correct = False
            
            # Check if this is a MultipleChoiceQuestion (we can check directly)
            if answer.question_content_type_id == mcq_ct.id:
                if answer.answer and answer.answer.is_correct:
                    is_correct = True
            else:
                # For other question types (Order, Connect, Number), we need to access the question
                # Try to access the question safely
                try:
                    # Accessing answer.question will trigger GenericForeignKey resolution
                    # If ContentType is invalid, this will raise an exception
                    if answer.question:
                        is_correct = answer.correct
                except (AttributeError, Exception):
                    # If ContentType is invalid or question doesn't exist, skip
                    continue
            
            if is_correct:
                key = (answer.question_content_type_id, answer.question_id)
                topic_id = question_to_topic.get(key)
                if topic_id:
                    student_id = answer.student.id
                    if student_id not in student_mastered_topics:
                        student_mastered_topics[student_id] = set()
                    student_mastered_topics[student_id].add(topic_id)
        
        # Serialize students with progress
        student_data = []
        for student in students:
            serializer = StudentSerializer(student)
            student_dict = serializer.data
            
            # Calculate progress
            mastered_topics = len(student_mastered_topics.get(student.id, set()))
            student_dict['progress'] = {
                'mastered_topics': mastered_topics,
                'total_topics': total_topics,
                'percentage': (mastered_topics / total_topics * 100) if total_topics > 0 else 0
            }
            
            student_data.append(student_dict)
        
        return student_data


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model."""
    
    student_groups_names = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    user = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'organization',
            'student_groups', 'student_groups_names', 'full_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_student_groups_names(self, obj):
        return [f"{g.name} ({g.course.name})" for g in obj.student_groups.all()]
    
    def create(self, validated_data):
        """Create student and automatically create user if it doesn't exist."""
        email = validated_data.get('email', '').strip()
        organization = validated_data.get('organization')
        
        if not email:
            raise serializers.ValidationError({'email': 'Email is required to create a user.'})
        
        # Get or create user
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'organization': organization,
                'is_active': True,
            }
        )
        
        if not created and user.organization != organization:
            raise serializers.ValidationError({
                'email': 'A user with this email already exists in a different organization.'
            })
        
        # Extract student_groups from validated_data
        student_groups = validated_data.pop('student_groups', [])
        
        # Create student
        student = Student.objects.create(
            user=user,
            **validated_data
        )
        
        # Set many-to-many relationships
        if student_groups:
            student.student_groups.set(student_groups)
        
        return student
    
    def update(self, instance, validated_data):
        """Update student."""
        # Extract student_groups if provided
        student_groups = validated_data.pop('student_groups', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update many-to-many relationships if provided
        if student_groups is not None:
            instance.student_groups.set(student_groups)
        
        return instance


class StudentDetailSerializer(StudentSerializer):
    """Detailed serializer for Student with question answers."""
    
    question_answers_count = serializers.SerializerMethodField()
    student_groups_with_progress = serializers.SerializerMethodField()
    
    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['question_answers_count', 'student_groups_with_progress']
    
    def get_question_answers_count(self, obj):
        return obj.question_answers.count()
    
    def get_student_groups_with_progress(self, obj):
        """Calculate progress for each student group the student belongs to."""
        from courses.models import Topic
        from django.contrib.contenttypes.models import ContentType
        from quizzes.models import MultipleChoiceQuestion, OrderQuestion, ConnectQuestion, NumberQuestion
        
        groups_data = []
        for group in obj.student_groups.all():
            # Get all topics from the student group's modules
            modules = group.modules.all()
            topics = Topic.objects.filter(
                lesson__module__in=modules,
                organization=obj.organization
            ).distinct()
            total_topics = topics.count()
            
            # Get correct answers for this student
            # Note: We can't filter directly on GenericForeignKey, so we need to get question IDs first
            topic_ids = list(topics.values_list('id', flat=True))
            
            # Get ContentTypes for question types
            mcq_ct = ContentType.objects.get_for_model(MultipleChoiceQuestion)
            order_ct = ContentType.objects.get_for_model(OrderQuestion)
            connect_ct = ContentType.objects.get_for_model(ConnectQuestion)
            number_ct = ContentType.objects.get_for_model(NumberQuestion)
            
            # Get question IDs from all question types in these topics
            mcq_ids = MultipleChoiceQuestion.objects.filter(
                topic__in=topic_ids,
                organization=obj.organization
            ).values_list('id', flat=True)
            order_ids = OrderQuestion.objects.filter(
                topic__in=topic_ids,
                organization=obj.organization
            ).values_list('id', flat=True)
            connect_ids = ConnectQuestion.objects.filter(
                topic__in=topic_ids,
                organization=obj.organization
            ).values_list('id', flat=True)
            number_ids = NumberQuestion.objects.filter(
                topic__in=topic_ids,
                organization=obj.organization
            ).values_list('id', flat=True)
            
            # Build list of (content_type_id, question_id) tuples
            question_refs = (
                [(mcq_ct.id, qid) for qid in mcq_ids] +
                [(order_ct.id, qid) for qid in order_ids] +
                [(connect_ct.id, qid) for qid in connect_ids] +
                [(number_ct.id, qid) for qid in number_ids]
            )
            
            # Filter StudentQuestionAnswer by content_type and question_id pairs
            from django.db.models import Q
            q_objects = Q()
            for ct_id, q_id in question_refs:
                q_objects |= Q(question_content_type_id=ct_id, question_id=q_id)
            
            # Get all answers (we'll filter for correct ones in Python since we need to check the 'correct' property)
            all_answers = StudentQuestionAnswer.objects.filter(
                student=obj
            ).filter(q_objects).select_related('answer', 'question_content_type')
            
            # Build a map of (content_type_id, question_id) -> topic_id
            question_to_topic = {}
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
            if number_ids:
                number_questions = NumberQuestion.objects.filter(id__in=number_ids).values('id', 'topic_id')
                for q in number_questions:
                    question_to_topic[(number_ct.id, q['id'])] = q['topic_id']
            
            # Count distinct topics with correct answers
            # Build set of valid ContentType IDs
            valid_ct_ids = {mcq_ct.id, order_ct.id, connect_ct.id, number_ct.id}
            
            mastered_topic_ids = set()
            for answer in all_answers:
                # Check if answer is correct
                # Only process if we have valid content_type and question_id
                if not answer.question_content_type_id or not answer.question_id:
                    continue
                
                # Only process if ContentType is one of our known question types
                if answer.question_content_type_id not in valid_ct_ids:
                    continue
                
                is_correct = False
                
                # Check if this is a MultipleChoiceQuestion (we can check directly)
                if answer.question_content_type_id == mcq_ct.id:
                    if answer.answer and answer.answer.is_correct:
                        is_correct = True
                else:
                    # For other question types (Order, Connect, Number), we need to access the question
                    # Try to access the question safely
                    try:
                        # Accessing answer.question will trigger GenericForeignKey resolution
                        # If ContentType is invalid, this will raise an exception
                        if answer.question:
                            is_correct = answer.correct
                    except (AttributeError, Exception):
                        # If ContentType is invalid or question doesn't exist, skip
                        continue
                
                if is_correct:
                    key = (answer.question_content_type_id, answer.question_id)
                    topic_id = question_to_topic.get(key)
                    if topic_id:
                        mastered_topic_ids.add(topic_id)
            
            mastered_topics = len(mastered_topic_ids)
            
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'course_name': group.course.name,
                'year': group.year,
                'progress': {
                    'mastered_topics': mastered_topics,
                    'total_topics': total_topics,
                    'percentage': (mastered_topics / total_topics * 100) if total_topics > 0 else 0
                }
            })
        
        return groups_data


class TopicProgressSerializer(serializers.Serializer):
    """Serializer for topic progress in a student group."""
    
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    lesson_name = serializers.CharField()
    module_name = serializers.CharField()
    course_name = serializers.CharField()
    questions_answered = serializers.IntegerField()
    questions_correct = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    percentage = serializers.FloatField()


class StudentQuestionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for StudentQuestionAnswer model."""
    
    student_name = serializers.SerializerMethodField()
    question_text = serializers.SerializerMethodField()
    question_type = serializers.SerializerMethodField()
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    answer_text = serializers.SerializerMethodField()
    answer_data_display = serializers.SerializerMethodField()
    correct = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentQuestionAnswer
        fields = [
            'id', 'student', 'question', 'quiz', 'answer', 'answer_data',
            'student_name', 'question_text', 'question_type', 'quiz_name',
            'answer_text', 'answer_data_display', 'correct',
            'organization', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def get_question_text(self, obj):
        """Get question text from any question type."""
        if obj.question:
            return obj.question.text
        return None
    
    def get_question_type(self, obj):
        """Get question type."""
        if obj.question:
            return obj.question.question_type
        return None
    
    def get_answer_text(self, obj):
        """Get answer text for MultipleChoiceQuestion."""
        if obj.answer:
            return obj.answer.text
        return None
    
    def get_answer_data_display(self, obj):
        """Get formatted answer data for OrderQuestion and ConnectQuestion."""
        if obj.answer_data:
            return obj.answer_data
        return None
    
    def get_correct(self, obj):
        """Return the correct property from the model."""
        return obj.correct
