from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Exercise, RehabPlan
from .serializers import ExerciseSerializer, RehabPlanSerializer
from .permissions import IsDoctor

class ExerciseListView(generics.ListAPIView):
    """
    Returns all available exercise templates ordered by name.
    Used by doctors for planning and patients for reference.
    """
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

class RehabPlanCreateView(generics.CreateAPIView):
    """
    Doctor creates a new rehab plan and assigns it to a patient.
    """
    queryset = RehabPlan.objects.all()
    serializer_class = RehabPlanSerializer
    permission_classes = [IsDoctor]

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

