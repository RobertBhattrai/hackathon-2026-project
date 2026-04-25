from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Exercise, RehabPlan, PlanExercise, ExerciseSession, SessionResult

User = get_user_model()

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = '__all__'

class PlanExerciseSerializer(serializers.ModelSerializer):
    exercise_id = serializers.IntegerField(write_only=True)
    exercise = ExerciseSerializer(read_only=True)

    class Meta:
        model = PlanExercise
        fields = ['exercise_id', 'exercise', 'order', 'target_reps']

class RehabPlanSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True)
    exercises = PlanExerciseSerializer(many=True)
    doctor_id = serializers.ReadOnlyField(source='doctor.id')

    class Meta:
        model = RehabPlan
        fields = ['id', 'doctor_id', 'patient_id', 'name', 'created_at', 'exercises']

    def validate_patient_id(self, value):
        try:
            patient = User.objects.get(id=value)
            if patient.role != 'patient':
                raise serializers.ValidationError("Target user must be a patient.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Patient does not exist.")

    def validate_exercises(self, value):
        if not value:
            raise serializers.ValidationError("At least one exercise required.")
        
        orders = [item['order'] for item in value]
        if len(orders) != len(set(orders)):
            raise serializers.ValidationError("Exercise order values must be unique.")
        
        return value

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises')
        patient_id = validated_data.pop('patient_id')
        patient = User.objects.get(id=patient_id)
        
        plan = RehabPlan.objects.create(patient=patient, **validated_data)
        
        for ex_data in exercises_data:
            exercise_id = ex_data.pop('exercise_id')
            exercise = Exercise.objects.get(id=exercise_id)
            PlanExercise.objects.create(plan=plan, exercise=exercise, **ex_data)
            
        return plan

class SessionResultSerializer(serializers.ModelSerializer):
    exercise_id = serializers.IntegerField()
    exercise_name = serializers.ReadOnlyField(source='exercise.name')

    class Meta:
        model = SessionResult
        fields = ['order', 'exercise_id', 'exercise_name', 'reps', 'accuracy', 'duration']

class ExerciseSessionSerializer(serializers.ModelSerializer):
    patient_id = serializers.ReadOnlyField(source='patient.id')
    plan_id = serializers.ReadOnlyField(source='plan.id')
    results = SessionResultSerializer(many=True)

    class Meta:
        model = ExerciseSession
        fields = ['id', 'patient_id', 'plan_id', 'started_at', 'completed_at', 'results']

    def validate_results(self, value):
        if not value:
            raise serializers.ValidationError("At least one result required.")
        
        orders = [item['order'] for item in value]
        if len(orders) != len(set(orders)):
            raise serializers.ValidationError("Result order values must be unique.")
        
        return value

    def update(self, instance, validated_data):
        results_data = validated_data.pop('results')
        instance.completed_at = validated_data.get('completed_at', instance.completed_at)
        instance.save()

        # Clear existing results
        instance.results.all().delete()

        # Validate exercises are in plan
        plan_exercise_ids = set(instance.plan.exercises.values_list('exercise_id', flat=True))
        submitted_exercise_ids = [item['exercise_id'] for item in results_data]
        invalid_ids = [eid for eid in submitted_exercise_ids if eid not in plan_exercise_ids]

        if invalid_ids:
            raise serializers.ValidationError({
                "detail": "Submitted results include exercises not assigned in this plan.",
                "exercise_ids": invalid_ids
            })

        for res_data in results_data:
            exercise_id = res_data.pop('exercise_id')
            exercise = Exercise.objects.get(id=exercise_id)
            SessionResult.objects.create(session=instance, exercise=exercise, **res_data)

        return instance
