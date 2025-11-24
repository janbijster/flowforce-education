from django.core.management.base import BaseCommand
from django.db import transaction
from organizations.models import Organization
from courses.models import Course, Module, Lesson, Topic
from quizzes.models import Quiz, Question, Option


class Command(BaseCommand):
    help = 'Populate database with sample quizzes, questions, and options for BHV content'

    def handle(self, *args, **options):
        self.stdout.write('Populating quizzes with sample data...')
        
        with transaction.atomic():
            # Get the BHV organization
            org = Organization.objects.get(name="BHV instituut")
            
            # Get relevant courses and modules
            basisopleiding = Course.objects.get(organization=org, name='Basisopleiding BHV')
            levensreddend_module = Module.objects.get(
                organization=org,
                course=basisopleiding,
                name='Levensreddende Eerste Hulp'
            )
            
            # Get topics
            bewustzijn_topic = Topic.objects.get(
                organization=org,
                name='Bewustzijn controleren'
            )
            reanimatie_topic = Topic.objects.get(
                organization=org,
                name='Reanimatie toepassen'
            )
            
            # Create quizzes
            quizzes = self.create_quizzes(org, basisopleiding, levensreddend_module)
            
            # Create questions
            questions = self.create_questions(org, quizzes, bewustzijn_topic, reanimatie_topic)
            
            # Create options
            self.create_options(org, questions)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated quizzes with sample data!')
        )

    def create_quizzes(self, org, course, module):
        """Create sample quizzes."""
        quizzes_data = [
            {
                'name': 'Basisopleiding BHV - Compleet Examen',
                'description': 'Volledige quiz voor de gehele basisopleiding',
                'course': course,
                'module': None
            },
            {
                'name': 'Levensreddende Eerste Hulp - Module Quiz',
                'description': 'Quiz specifiek voor de levensreddende eerste hulp module',
                'course': course,
                'module': module
            },
            {
                'name': 'Bewustzijn en Reanimatie - Topic Quiz',
                'description': 'Gerichte quiz over bewustzijn en reanimatie',
                'course': None,
                'module': None
            }
        ]
        
        quizzes = {}
        for quiz_data in quizzes_data:
            quiz, created = Quiz.objects.get_or_create(
                organization=org,
                name=quiz_data['name'],
                defaults={
                    'description': quiz_data['description'],
                    'course': quiz_data['course'],
                    'module': quiz_data['module']
                }
            )
            quizzes[quiz_data['name']] = quiz
            if created:
                self.stdout.write(f'Created quiz: {quiz.name}')
            else:
                self.stdout.write(f'Quiz already exists: {quiz.name}')
        
        return quizzes

    def create_questions(self, org, quizzes, bewustzijn_topic, reanimatie_topic):
        """Create sample questions."""
        questions_data = [
            {
                'text': 'Wat zijn de tekenen van bewusteloosheid?',
                'quiz': 'Basisopleiding BHV - Compleet Examen',
                'topic': bewustzijn_topic
            },
            {
                'text': 'Welke stappen neem je bij een bewusteloos slachtoffer?',
                'quiz': 'Basisopleiding BHV - Compleet Examen',
                'topic': bewustzijn_topic
            },
            {
                'text': 'Hoe diep moeten borstcompressies zijn bij reanimatie?',
                'quiz': 'Levensreddende Eerste Hulp - Module Quiz',
                'topic': reanimatie_topic
            },
            {
                'text': 'Wanneer moet je een AED gebruiken?',
                'quiz': 'Levensreddende Eerste Hulp - Module Quiz',
                'topic': reanimatie_topic
            },
            {
                'text': 'Hoe vaak per minuut voer je borstcompressies uit?',
                'quiz': 'Bewustzijn en Reanimatie - Topic Quiz',
                'topic': reanimatie_topic
            }
        ]
        
        questions = {}
        for q_data in questions_data:
            question, created = Question.objects.get_or_create(
                organization=org,
                text=q_data['text'],
                defaults={
                    'quiz': quizzes.get(q_data['quiz']),
                    'topic': q_data['topic']
                }
            )
            
            questions[q_data['text']] = question
            if created:
                self.stdout.write(f'Created question: {question.text[:50]}...')
            else:
                self.stdout.write(f'Question already exists: {question.text[:50]}...')
        
        return questions

    def create_options(self, org, questions):
        """Create sample options for questions."""
        options_data = {
            'Wat zijn de tekenen van bewusteloosheid?': [
                {'text': 'Niet reageren op aanspreken en schudden', 'is_correct': True},
                {'text': 'Normale ademhaling', 'is_correct': False},
                {'text': 'Volledig bewustzijn', 'is_correct': False},
                {'text': 'Normale hartslag', 'is_correct': False}
            ],
            'Welke stappen neem je bij een bewusteloos slachtoffer?': [
                {'text': 'Direct reanimeren', 'is_correct': False},
                {'text': 'Check gevaar, aanspreken, 112 bellen, ademhaling checken', 'is_correct': True},
                {'text': 'Slachtoffer alleen laten', 'is_correct': False},
                {'text': 'Eerst filmen voor social media', 'is_correct': False}
            ],
            'Hoe diep moeten borstcompressies zijn bij reanimatie?': [
                {'text': '1-2 cm', 'is_correct': False},
                {'text': '5-6 cm', 'is_correct': True},
                {'text': '10 cm', 'is_correct': False},
                {'text': 'Zo diep mogelijk', 'is_correct': False}
            ],
            'Wanneer moet je een AED gebruiken?': [
                {'text': 'Nooit', 'is_correct': False},
                {'text': 'Bij elke hartstilstand, als deze beschikbaar is', 'is_correct': True},
                {'text': 'Alleen bij jonge slachtoffers', 'is_correct': False},
                {'text': 'Alleen door medisch personeel', 'is_correct': False}
            ],
            'Hoe vaak per minuut voer je borstcompressies uit?': [
                {'text': '50-70 per minuut', 'is_correct': False},
                {'text': '100-120 per minuut', 'is_correct': True},
                {'text': '150+ per minuut', 'is_correct': False},
                {'text': 'Zo snel mogelijk', 'is_correct': False}
            ]
        }
        
        for question_text, options_list in options_data.items():
            question = questions.get(question_text)
            if not question:
                continue
            
            for opt_data in options_list:
                option, created = Option.objects.get_or_create(
                    organization=org,
                    question=question,
                    text=opt_data['text'],
                    defaults={'is_correct': opt_data['is_correct']}
                )
                if created:
                    self.stdout.write(f'  Created option: {opt_data["text"][:40]}...')

