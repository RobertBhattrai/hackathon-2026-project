from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Exercise
from .serializers import ExerciseSerializer

class ExerciseListView(generics.ListAPIView):
    """
    Returns all available exercise templates ordered by name.
    Used by doctors for planning and patients for reference.
    """
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
