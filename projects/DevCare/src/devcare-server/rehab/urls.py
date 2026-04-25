from django.urls import path
from .views import ExerciseListView, RehabPlanCreateView, RehabPlanDetailView, CompleteSessionView

urlpatterns = [
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('plans/', RehabPlanCreateView.as_view(), name='rehab-plan-create'),
    path('plans/<int:pk>/', RehabPlanDetailView.as_view(), name='rehab-plan-detail'),
    path('sessions/<int:pk>/complete/', CompleteSessionView.as_view(), name='complete-session'),
]
