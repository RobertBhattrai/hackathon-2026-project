from django.urls import path
from .views import ExerciseListView, RehabPlanCreateView

urlpatterns = [
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('plans/', RehabPlanCreateView.as_view(), name='rehab-plan-create'),
]
