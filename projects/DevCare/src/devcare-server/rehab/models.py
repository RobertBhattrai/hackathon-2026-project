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

class RehabPlan(models.Model):
    name = models.CharField(max_length=120)
    doctor = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='plans_created')
    patient = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='rehab_plans')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.patient.username})"

class PlanExercise(models.Model):
    plan = models.ForeignKey(RehabPlan, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    target_reps = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ('plan', 'order')
