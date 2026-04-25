from django.urls import path
from .views import ExerciseListView, RehabPlanCreateView, RehabPlanDetailView

urlpatterns = [
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('plans/', RehabPlanCreateView.as_view(), name='rehab-plan-create'),
    path('plans/<int:pk>/', RehabPlanDetailView.as_view(), name='rehab-plan-detail'),
]
