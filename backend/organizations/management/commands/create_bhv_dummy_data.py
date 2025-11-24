from django.core.management.base import BaseCommand
from django.db import transaction
from organizations.models import Organization
from courses.models import Course, Module, Lesson, Topic


class Command(BaseCommand):
    help = 'Create dummy BHV certification content'

    def handle(self, *args, **options):
        self.stdout.write('Creating BHV dummy content...')
        
        with transaction.atomic():
            # Create organization
            org = self.create_organization()
            
            # Create courses
            courses = self.create_courses(org)
            
            # Create modules
            modules = self.create_modules(org, courses)
            
            # Create lessons
            lessons = self.create_lessons(org, modules)
            
            # Create topics
            topics = self.create_topics(org, lessons)
            
            # Topics now serve as learning objectives, no separate model needed
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created BHV dummy content!')
        )

    def create_organization(self):
        """Create BHV instituut organization."""
        org, created = Organization.objects.get_or_create(
            name="BHV instituut",
            defaults={
                'slug': 'bhv-instituut',
                'description': 'Gespecialiseerd instituut voor Bedrijfshulpverlening (BHV) trainingen en certificeringen.'
            }
        )
        if created:
            self.stdout.write(f'Created organization: {org.name}')
        else:
            self.stdout.write(f'Organization already exists: {org.name}')
        return org

    def create_courses(self, org):
        """Create BHV courses."""
        courses_data = [
            {
                'name': 'Basisopleiding BHV',
                'description': 'Een complete basistraining voor nieuwe BHV\'ers, gericht op levensreddend handelen en brandbestrijding.'
            },
            {
                'name': 'Herhalingscursus BHV',
                'description': 'Een jaarlijkse opfristraining voor gecertificeerde BHV\'ers om kennis en vaardigheden bij te houden.'
            },
            {
                'name': 'Specialistische BHV',
                'description': 'Voor BHV\'ers met een coördinerende rol of werkend in risicovolle omgevingen zoals industrie of zorg.'
            }
        ]
        
        courses = {}
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                organization=org,
                name=course_data['name'],
                defaults={'description': course_data['description']}
            )
            courses[course_data['name']] = course
            if created:
                self.stdout.write(f'Created course: {course.name}')
            else:
                self.stdout.write(f'Course already exists: {course.name}')
        
        return courses

    def create_modules(self, org, courses):
        """Create modules for each course."""
        modules_data = [
            {
                'name': 'Levensreddende Eerste Hulp',
                'description': 'Eerste hulp bij bewusteloosheid, reanimatie, en letsels.',
                'course': 'Basisopleiding BHV'
            },
            {
                'name': 'Brandbestrijding en Ontruiming',
                'description': 'Herkennen, melden en bestrijden van beginnende branden en ontruimen van het gebouw.',
                'course': 'Basisopleiding BHV'
            },
            {
                'name': 'Communicatie en Coördinatie',
                'description': 'Effectieve communicatie en taakverdeling tijdens noodsituaties.',
                'course': 'Herhalingscursus BHV'
            },
            {
                'name': 'Specifieke Risico\'s op de Werkplek',
                'description': 'Omgaan met situaties zoals chemische risico\'s of sector-specifieke noodprocedures.',
                'course': 'Specialistische BHV'
            }
        ]
        
        modules = {}
        for module_data in modules_data:
            module, created = Module.objects.get_or_create(
                organization=org,
                course=courses[module_data['course']],
                name=module_data['name'],
                defaults={'description': module_data['description']}
            )
            modules[module_data['name']] = module
            if created:
                self.stdout.write(f'Created module: {module.name}')
            else:
                self.stdout.write(f'Module already exists: {module.name}')
        
        return modules

    def create_lessons(self, org, modules):
        """Create lessons for each module."""
        lessons_data = [
            {
                'name': 'Bewustzijn en Reanimatie',
                'description': 'Leer hoe je bewusteloosheid herkent en reanimatie toepast.',
                'module': 'Levensreddende Eerste Hulp'
            },
            {
                'name': 'Brand herkennen en bestrijden',
                'description': 'Leer hoe je branden herkent, bestrijdt en ontruimingsplannen uitvoert.',
                'module': 'Brandbestrijding en Ontruiming'
            },
            {
                'name': 'Samenwerken tijdens incidenten',
                'description': 'Leer effectief communiceren en taken verdelen tijdens incidenten.',
                'module': 'Communicatie en Coördinatie'
            },
            {
                'name': 'Werkomgeving en risico\'s',
                'description': 'Leer omgaan met specifieke risico\'s in verschillende werkomgevingen.',
                'module': 'Specifieke Risico\'s op de Werkplek'
            }
        ]
        
        lessons = {}
        for lesson_data in lessons_data:
            lesson, created = Lesson.objects.get_or_create(
                organization=org,
                module=modules[lesson_data['module']],
                name=lesson_data['name'],
                defaults={'description': lesson_data['description']}
            )
            lessons[lesson_data['name']] = lesson
            if created:
                self.stdout.write(f'Created lesson: {lesson.name}')
            else:
                self.stdout.write(f'Lesson already exists: {lesson.name}')
        
        return lessons

    def create_topics(self, org, lessons):
        """Create topics for each lesson."""
        topics_data = [
            # Bewustzijn en Reanimatie topics
            {
                'name': 'Bewustzijn controleren',
                'description': 'Herkennen van bewusteloosheid en stappen bij aantreffen bewusteloos slachtoffer.',
                'lesson': 'Bewustzijn en Reanimatie'
            },
            {
                'name': 'Reanimatie toepassen',
                'description': 'Correct uitvoeren van borstcompressies en gebruik van AED.',
                'lesson': 'Bewustzijn en Reanimatie'
            },
            # Brand herkennen en bestrijden topics
            {
                'name': 'Kleine branden blussen',
                'description': 'Verschillende blusmiddelen herkennen en juiste blusmiddel kiezen per brandsoort.',
                'lesson': 'Brand herkennen en bestrijden'
            },
            {
                'name': 'Ontruimingsplan uitvoeren',
                'description': 'Alarmeren bij brand en leiding geven aan ontruiming.',
                'lesson': 'Brand herkennen en bestrijden'
            },
            # Samenwerken tijdens incidenten topics
            {
                'name': 'Intern communiceren',
                'description': 'Effectieve communicatie met andere BHV\'ers en gebruik van portofoons.',
                'lesson': 'Samenwerken tijdens incidenten'
            },
            {
                'name': 'Taken verdelen',
                'description': 'Aansturing bij incident en rolverdeling binnen BHV-team.',
                'lesson': 'Samenwerken tijdens incidenten'
            },
            # Werkomgeving en risico's topics
            {
                'name': 'Risico\'s in de industrie',
                'description': 'Omgaan met gevaarlijke stoffen en specifieke noodprocedures kennen.',
                'lesson': 'Werkomgeving en risico\'s'
            },
            {
                'name': 'BHV in de zorg',
                'description': 'Rekening houden met patiënten bij incidenten en gebruik van evacuatiemiddelen.',
                'lesson': 'Werkomgeving en risico\'s'
            }
        ]
        
        topics = {}
        for topic_data in topics_data:
            topic, created = Topic.objects.get_or_create(
                organization=org,
                lesson=lessons[topic_data['lesson']],
                name=topic_data['name'],
                defaults={'description': topic_data['description']}
            )
            topics[topic_data['name']] = topic
            if created:
                self.stdout.write(f'Created topic: {topic.name}')
            else:
                self.stdout.write(f'Topic already exists: {topic.name}')
        
        return topics

    # Removed: Topics now serve as learning objectives, no separate model needed
    def _removed_create_learning_objectives(self, org, topics):
        """Create learning objectives for each topic."""
        learning_objectives_data = [
            # Bewustzijn controleren
            {
                'name': 'Herkennen van bewusteloosheid',
                'description': 'De cursist kan bewusteloosheid herkennen aan de hand van specifieke symptomen.',
                'topics': ['Bewustzijn controleren']
            },
            {
                'name': 'Stappen bij bewusteloos slachtoffer',
                'description': 'De cursist kan de juiste stappen uitvoeren bij het aantreffen van een bewusteloos slachtoffer.',
                'topics': ['Bewustzijn controleren']
            },
            # Reanimatie toepassen
            {
                'name': 'Correcte borstcompressies',
                'description': 'De cursist kan correcte borstcompressies uitvoeren volgens de richtlijnen.',
                'topics': ['Reanimatie toepassen']
            },
            {
                'name': 'AED gebruik',
                'description': 'De cursist kan een AED veilig en effectief gebruiken tijdens reanimatie.',
                'topics': ['Reanimatie toepassen']
            },
            # Kleine branden blussen
            {
                'name': 'Blusmiddelen herkennen',
                'description': 'De cursist kan verschillende blusmiddelen herkennen en hun toepassing begrijpen.',
                'topics': ['Kleine branden blussen']
            },
            {
                'name': 'Juiste blusmiddel kiezen',
                'description': 'De cursist kan het juiste blusmiddel kiezen afhankelijk van het type brand.',
                'topics': ['Kleine branden blussen']
            },
            # Ontruimingsplan uitvoeren
            {
                'name': 'Brandalarm activeren',
                'description': 'De cursist weet hoe en wanneer het brandalarm geactiveerd moet worden.',
                'topics': ['Ontruimingsplan uitvoeren']
            },
            {
                'name': 'Ontruiming leiden',
                'description': 'De cursist kan leiding geven aan een veilige ontruiming van het gebouw.',
                'topics': ['Ontruimingsplan uitvoeren']
            },
            # Intern communiceren
            {
                'name': 'Effectieve BHV communicatie',
                'description': 'De cursist kan effectief communiceren met andere BHV\'ers tijdens incidenten.',
                'topics': ['Intern communiceren']
            },
            {
                'name': 'Portofoon gebruik',
                'description': 'De cursist kan portofoons correct gebruiken voor communicatie tijdens incidenten.',
                'topics': ['Intern communiceren']
            },
            # Taken verdelen
            {
                'name': 'Incident aansturing',
                'description': 'De cursist kan een incident aansturen en de juiste beslissingen nemen.',
                'topics': ['Taken verdelen']
            },
            {
                'name': 'BHV team coördinatie',
                'description': 'De cursist kan rollen en taken verdelen binnen het BHV-team.',
                'topics': ['Taken verdelen']
            },
            # Risico's in de industrie
            {
                'name': 'Gevaarlijke stoffen herkennen',
                'description': 'De cursist kan gevaarlijke stoffen herkennen en de bijbehorende risico\'s inschatten.',
                'topics': ['Risico\'s in de industrie']
            },
            {
                'name': 'Industriële noodprocedures',
                'description': 'De cursist kent de specifieke noodprocedures voor industriële omgevingen.',
                'topics': ['Risico\'s in de industrie']
            },
            # BHV in de zorg
            {
                'name': 'Patiëntveiligheid bij incidenten',
                'description': 'De cursist kan rekening houden met patiëntveiligheid tijdens incidenten.',
                'topics': ['BHV in de zorg']
            },
            {
                'name': 'Evacuatiemiddelen gebruiken',
                'description': 'De cursist kan evacuatiemiddelen correct gebruiken voor patiënten.',
                'topics': ['BHV in de zorg']
            }
        ]
        
        learning_objectives = {}
        for lo_data in learning_objectives_data:
            lo, created = LearningObjective.objects.get_or_create(
                organization=org,
                name=lo_data['name'],
                defaults={'description': lo_data['description']}
            )
            learning_objectives[lo_data['name']] = lo
            if created:
                self.stdout.write(f'Created learning objective: {lo.name}')
            else:
                self.stdout.write(f'Learning objective already exists: {lo.name}')
        
        return learning_objectives

    # Removed: Topics now serve as learning objectives, no separate model needed
    def _removed_link_learning_objectives_to_topics(self, learning_objectives, topics):
        """Link learning objectives to their respective topics."""
        for lo_name, lo in learning_objectives.items():
            # Find topics that should be linked to this learning objective
            topic_names = []
            for topic_name, topic in topics.items():
                if any(keyword in lo_name.lower() for keyword in topic_name.lower().split()):
                    topic_names.append(topic_name)
            
            # Add more specific linking based on content
            if 'bewusteloosheid' in lo_name.lower() or 'bewusteloos' in lo_name.lower():
                topic_names.append('Bewustzijn controleren')
            elif 'reanimatie' in lo_name.lower() or 'borstcompressies' in lo_name.lower() or 'aed' in lo_name.lower():
                topic_names.append('Reanimatie toepassen')
            elif 'blusmiddel' in lo_name.lower() or 'brand' in lo_name.lower():
                topic_names.append('Kleine branden blussen')
            elif 'ontruiming' in lo_name.lower() or 'brandalarm' in lo_name.lower():
                topic_names.append('Ontruimingsplan uitvoeren')
            elif 'communicatie' in lo_name.lower() or 'portofoon' in lo_name.lower():
                topic_names.append('Intern communiceren')
            elif 'aansturing' in lo_name.lower() or 'coördinatie' in lo_name.lower() or 'team' in lo_name.lower():
                topic_names.append('Taken verdelen')
            elif 'gevaarlijke stoffen' in lo_name.lower() or 'industrie' in lo_name.lower():
                topic_names.append('Risico\'s in de industrie')
            elif 'patiënt' in lo_name.lower() or 'evacuatie' in lo_name.lower() or 'zorg' in lo_name.lower():
                topic_names.append('BHV in de zorg')
            
            # Link the learning objective to topics
            for topic_name in topic_names:
                if topic_name in topics:
                    lo.topics.add(topics[topic_name])
                    self.stdout.write(f'Linked "{lo.name}" to topic "{topic_name}"')
