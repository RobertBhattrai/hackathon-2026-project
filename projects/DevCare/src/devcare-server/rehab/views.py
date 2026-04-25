from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Exercise, RehabPlan, ExerciseSession
from .serializers import ExerciseSerializer, RehabPlanSerializer, ExerciseSessionSerializer
from .permissions import IsDoctor, IsAssignedDoctorOrPatient, IsSessionPatient


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

class RehabPlanDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific rehab plan with its ordered exercises.
    Assigned doctor or patient only.
    """
    queryset = RehabPlan.objects.all()
    serializer_class = RehabPlanSerializer
    permission_classes = [IsAssignedDoctorOrPatient]

class CompleteSessionView(generics.UpdateAPIView):
    """
    Patient completes a session by submitting per-exercise performance results.
    """
    queryset = ExerciseSession.objects.all()
    serializer_class = ExerciseSessionSerializer
    permission_classes = [IsSessionPatient]
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
