# Organizations App

This Django app provides multi-tenant functionality for FlowForce Education.

## Models

### Organization
The top-level tenant model that contains:
- `name`: Organization name (unique)
- `slug`: URL-friendly identifier (unique)
- `description`: Optional description
- `created_at` / `updated_at`: Timestamps

### User
Custom user model that extends Django's AbstractUser with:
- `organization`: Foreign key to Organization (required)
- All standard Django user fields (username, email, etc.)

## Management Commands

### create_default_org
Creates a default organization for testing:
```bash
python manage.py create_default_org
```

## Usage

All future models should include a foreign key to Organization for multi-tenant data isolation:

```python
class MyModel(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    # ... other fields
```

## Admin Interface

Both Organization and User models are registered in Django admin with appropriate filters and search functionality.
