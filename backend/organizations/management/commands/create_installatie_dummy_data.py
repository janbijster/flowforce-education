from django.core.management.base import BaseCommand
from django.db import transaction
from organizations.models import Organization
from courses.models import Course, Module, Lesson, Topic


class Command(BaseCommand):
    help = "Create dummy Installatiebranche opleider content"

    def handle(self, *args, **options):
        self.stdout.write("Creating Installatiebranche opleider dummy content...")

        with transaction.atomic():
            organization = self.create_organization()
            courses = self.create_courses(organization)
            modules = self.create_modules(organization, courses)
            lessons = self.create_lessons(organization, modules)
            self.create_topics(organization, lessons)

        self.stdout.write(
            self.style.SUCCESS("Successfully created Installatiebranche dummy content!")
        )

    def create_organization(self):
        """Create Installatiebranche opleider organization."""
        org, created = Organization.objects.get_or_create(
            name="Installatiebranche opleider",
            defaults={
                "slug": "installatiebranche-opleider",
                "description": (
                    "Specialist in praktijkgerichte trainingen voor installateurs in de koel- en aircotechniek."
                ),
            },
        )
        if created:
            self.stdout.write(f"Created organization: {org.name}")
        else:
            self.stdout.write(f"Organization already exists: {org.name}")
        return org

    def create_courses(self, org):
        """Create courses for the organization."""
        courses_data = [
            {
                "name": "Specialisatiecursus Airconditioning",
                "description": (
                    "Theoretische en praktische verdieping voor installateurs die willen leren werken "
                    "met airco- en VRF-systemen."
                ),
            },
            {
                "name": "Leer-werktraject Elektricien",
                "description": (
                    "Praktijkgericht traject voor het opleiden van leerling-elektriciens tot volwaardig installatiemonteur."
                ),
            },
            {
                "name": "Leer-werktraject Loodgieter",
                "description": (
                    "Vakopleiding voor aspirant-loodgieters met focus op water, gas en sanitair."
                ),
            },
            {
                "name": "Aanvullende cursus Warmtepomp",
                "description": (
                    "Praktijkmodule voor installatieprofessionals die warmtepompen willen installeren, onderhouden en inregelen."
                ),
            },
        ]

        courses = {}
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                organization=org,
                name=course_data["name"],
                defaults={"description": course_data["description"]},
            )
            courses[course_data["name"]] = course
            if created:
                self.stdout.write(f"Created course: {course.name}")
            else:
                self.stdout.write(f"Course already exists: {course.name}")
        return courses

    def create_modules(self, org, courses):
        modules_data = [
            {
                "name": "Koelkringloop en componenten",
                "description": (
                    "Inzicht in de werking van de koelkringloop en de belangrijkste onderdelen."
                ),
                "course": "Specialisatiecursus Airconditioning",
            },
            {
                "name": "Installatie en inbedrijfstelling",
                "description": (
                    "Vaardigheden voor het interpreteren van metingen en het correct opstarten "
                    "van aircosystemen."
                ),
                "course": "Specialisatiecursus Airconditioning",
            },
        ]

        modules = {}
        for module_data in modules_data:
            module, created = Module.objects.get_or_create(
                organization=org,
                course=courses[module_data["course"]],
                name=module_data["name"],
                defaults={"description": module_data["description"]},
            )
            modules[module_data["name"]] = module
            if created:
                self.stdout.write(f"Created module: {module.name}")
            else:
                self.stdout.write(f"Module already exists: {module.name}")
        return modules

    def create_lessons(self, org, modules):
        lessons_data = [
            {
                "name": "Werking van de koelkringloop",
                "description": "Verdieping in de werking van een koelkringloop.",
                "module": "Koelkringloop en componenten",
            },
            {
                "name": "VRF-systeemwerking",
                "description": "Kennis over de werking en regeling van VRF-systemen.",
                "module": "Koelkringloop en componenten",
            },
            {
                "name": "Metingen en interpretatie",
                "description": "Druk- en temperatuurmetingen lezen en interpreteren.",
                "module": "Installatie en inbedrijfstelling",
            },
            {
                "name": "Inbedrijfstellen",
                "description": "Stap-voor-stap airco-installaties opstarten.",
                "module": "Installatie en inbedrijfstelling",
            },
        ]

        lessons = {}
        for lesson_data in lessons_data:
            lesson, created = Lesson.objects.get_or_create(
                organization=org,
                module=modules[lesson_data["module"]],
                name=lesson_data["name"],
                defaults={"description": lesson_data["description"]},
            )
            lessons[lesson_data["name"]] = lesson
            if created:
                self.stdout.write(f"Created lesson: {lesson.name}")
            else:
                self.stdout.write(f"Lesson already exists: {lesson.name}")
        return lessons

    def create_topics(self, org, lessons):
        topics_data = [
            {
                "name": "Functie compressor",
                "description": "Je kent de functie van de compressor in een koelkringloop.",
                "lesson": "Werking van de koelkringloop",
            },
            {
                "name": "Componenten binnen- en buitendeel",
                "description": (
                    "Je herkent componenten van een binnen- en buitendeel van een VRF-installatie."
                ),
                "lesson": "Werking van de koelkringloop",
            },
            {
                "name": "Invloedfactoren VRF",
                "description": "Je weet welke factoren de werking van een VRF-systeem beïnvloeden.",
                "lesson": "VRF-systeemwerking",
            },
            {
                "name": "Drukverloop interpreteren",
                "description": "Je kunt drukken interpreteren bij gebruik van het h-log p-diagram.",
                "lesson": "Metingen en interpretatie",
            },
            {
                "name": "Opstart airco-installatie",
                "description": "Je kent de stappen om een airco-installatie in bedrijf te stellen.",
                "lesson": "Inbedrijfstellen",
            },
        ]

        for topic_data in topics_data:
            topic, created = Topic.objects.get_or_create(
                organization=org,
                lesson=lessons[topic_data["lesson"]],
                name=topic_data["name"],
                defaults={"description": topic_data["description"]},
            )
            if created:
                self.stdout.write(f"Created topic: {topic.name}")
            else:
                self.stdout.write(f"Topic already exists: {topic.name}")


