from django.core.management.base import BaseCommand
from organizations.models import Organization


class Command(BaseCommand):
    help = 'Create a default organization for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            default='Default Organization',
            help='Name of the organization to create'
        )
        parser.add_argument(
            '--slug',
            type=str,
            default='default-org',
            help='Slug of the organization to create'
        )

    def handle(self, *args, **options):
        name = options['name']
        slug = options['slug']
        
        organization, created = Organization.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'description': f'Default organization: {name}'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created organization "{organization.name}"')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Organization "{organization.name}" already exists')
            )
