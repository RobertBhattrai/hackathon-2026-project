from django.db import models

class Exercise(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    target_joint = models.CharField(max_length=50)
    instructions = models.TextField()
    min_angle = models.FloatField()
    max_angle = models.FloatField()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
