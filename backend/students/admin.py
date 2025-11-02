from django.contrib import admin
from .models import StudentGroup, Student, StudentQuestionAnswer


admin.site.register(StudentGroup)
admin.site.register(Student)
admin.site.register(StudentQuestionAnswer)

