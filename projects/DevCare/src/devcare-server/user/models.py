from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    email = models.EmailField(unique=True, blank=True)

    def __str__(self):
        return f'{self.username} ({self.role})'
