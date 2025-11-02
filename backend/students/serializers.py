from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentGroup, Student, StudentQuestionAnswer

User = get_user_model()


class StudentGroupSerializer(serializers.ModelSerializer):
    """Serializer for StudentGroup model."""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    module_name = serializers.CharField(source='module.name', read_only=True)
    students_count = serializers.SerializerMethodField()
    course_name_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGroup
        fields = [
            'id', 'name', 'organization', 'course', 'module', 'year',
            'course_name', 'module_name', 'course_name_display', 'students_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_students_count(self, obj):
        return obj.students.count()
    
    def get_course_name_display(self, obj):
        """Return course name for display purposes."""
        return obj.course.name


class StudentGroupDetailSerializer(StudentGroupSerializer):
    """Detailed serializer for StudentGroup with students."""
    
    students = serializers.SerializerMethodField()
    
    class Meta(StudentGroupSerializer.Meta):
        fields = StudentGroupSerializer.Meta.fields + ['students']
    
    def get_students(self, obj):
        students = obj.students.all()
        return StudentSerializer(students, many=True).data


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
    
    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['question_answers_count']
    
    def get_question_answers_count(self, obj):
        return obj.question_answers.count()


class StudentQuestionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for StudentQuestionAnswer model."""
    
    student_name = serializers.SerializerMethodField()
    question_text = serializers.CharField(source='question.text', read_only=True)
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    answer_text = serializers.CharField(source='answer.text', read_only=True)
    correct = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentQuestionAnswer
        fields = [
            'id', 'student', 'question', 'quiz', 'answer',
            'student_name', 'question_text', 'quiz_name', 'answer_text', 'correct',
            'organization', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def get_correct(self, obj):
        """Return the correct property from the model."""
        return obj.correct

