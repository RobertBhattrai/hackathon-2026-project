from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Exercise, RehabPlan, ExerciseSession, SessionResult, PlanExercise



User = get_user_model()

class RehabAPITests(APITestCase):
    def setUp(self):
        # Create a doctor
        self.doctor = User.objects.create_user(
            email='doctor@test.com',
            username='doctor',
            password='password123',
            role='doctor'
        )
        # Create a patient
        self.patient = User.objects.create_user(
            email='patient@test.com',
            username='patient',
            password='password123',
            role='patient'
        )
        # Create an exercise template
        self.exercise = Exercise.objects.create(
            name='Test Exercise',
            description='Test Description',
            target_joint='elbow',
            instructions='Test Instructions',
            min_angle=0.0,
            max_angle=180.0
        )
        
        # Authentication URLs
        self.login_url = reverse('login')
        self.exercises_url = reverse('exercise-list')
        self.plans_url = reverse('rehab-plan-create')

    def authenticate(self, email, password):
        response = self.client.post(self.login_url, {
            'email': email,
            'password': password
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_exercise_list_authenticated(self):
        """Ensure any authenticated user can list exercises."""
        self.authenticate('patient@test.com', 'password123')
        response = self.client.get(self.exercises_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Exercise')

    def test_exercise_list_unauthenticated(self):
        """Ensure unauthenticated users cannot list exercises."""
        response = self.client.get(self.exercises_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_rehab_plan_as_doctor(self):
        """Ensure doctors can create rehab plans."""
        self.authenticate('doctor@test.com', 'password123')
        data = {
            "patient_id": self.patient.id,
            "name": "Test Plan",
            "exercises": [
                {
                    "exercise_id": self.exercise.id,
                    "order": 1,
                    "target_reps": 10
                }
            ]
        }
        response = self.client.post(self.plans_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RehabPlan.objects.count(), 1)
        self.assertEqual(RehabPlan.objects.first().doctor, self.doctor)

    def test_create_rehab_plan_as_patient(self):
        """Ensure patients cannot create rehab plans."""
        self.authenticate('patient@test.com', 'password123')
        data = {
            "patient_id": self.patient.id,
            "name": "Forbidden Plan",
            "exercises": []
        }
        response = self.client.post(self.plans_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rehab_plan_validation_invalid_patient(self):
        """Ensure creating a plan for a non-existent patient fails."""
        self.authenticate('doctor@test.com', 'password123')
        data = {
            "patient_id": 9999,
            "name": "Invalid Patient Plan",
            "exercises": [
                {
                    "exercise_id": self.exercise.id,
                    "order": 1,
                    "target_reps": 10
                }
            ]
        }
        response = self.client.post(self.plans_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('patient_id', response.data)

    def test_rehab_plan_validation_duplicate_order(self):
        """Ensure duplicate exercise orders are rejected."""
        self.authenticate('doctor@test.com', 'password123')
        data = {
            "patient_id": self.patient.id,
            "name": "Duplicate Order Plan",
            "exercises": [
                {
                    "exercise_id": self.exercise.id,
                    "order": 1,
                    "target_reps": 10
                },
                {
                    "exercise_id": self.exercise.id,
                    "order": 1,
                    "target_reps": 15
                }
            ]
        }
        response = self.client.post(self.plans_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exercises', response.data)

    def test_get_rehab_plan_detail_as_assigned_doctor(self):
        """Doctor can view plan they created."""
        # Create a plan
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        url = reverse('rehab-plan-detail', kwargs={'pk': plan.id})
        
        self.authenticate('doctor@test.com', 'password123')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Plan")

    def test_get_rehab_plan_detail_as_assigned_patient(self):
        """Patient can view plan assigned to them."""
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        url = reverse('rehab-plan-detail', kwargs={'pk': plan.id})
        
        self.authenticate('patient@test.com', 'password123')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_rehab_plan_detail_unauthorized_doctor(self):
        """Doctor cannot view plans they didn't create."""
        other_doctor = User.objects.create_user(email='other@test.com', username='other', password='password123', role='doctor')
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        url = reverse('rehab-plan-detail', kwargs={'pk': plan.id})
        
        self.authenticate('other@test.com', 'password123')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "You can only view plans you created.")

    def test_get_rehab_plan_detail_unauthorized_patient(self):
        """Patient cannot view plans not assigned to them."""
        other_patient = User.objects.create_user(email='otherp@test.com', username='otherp', password='password123', role='patient')
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        url = reverse('rehab-plan-detail', kwargs={'pk': plan.id})
        
        self.authenticate('otherp@test.com', 'password123')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "You can only view plans assigned to you.")

    def test_complete_session_success(self):
        """Patient can complete their own session."""
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        PlanExercise.objects.create(plan=plan, exercise=self.exercise, order=1, target_reps=10)

        
        session = ExerciseSession.objects.create(patient=self.patient, plan=plan)
        url = reverse('complete-session', kwargs={'pk': session.id})
        
        data = {
            "completed_at": "2026-04-25T14:45:00Z",
            "results": [
                {
                    "exercise_id": self.exercise.id,
                    "order": 1,
                    "reps": 8,
                    "accuracy": 85.5,
                    "duration": 120.0
                }
            ]
        }
        
        self.authenticate('patient@test.com', 'password123')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['completed_at'])
        self.assertEqual(len(response.data['results']), 1)

    def test_complete_session_forbidden_other_patient(self):
        """Patient cannot complete someone else's session."""
        other_patient = User.objects.create_user(email='otherp2@test.com', username='otherp2', password='password123', role='patient')
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        session = ExerciseSession.objects.create(patient=self.patient, plan=plan)
        url = reverse('complete-session', kwargs={'pk': session.id})
        
        self.authenticate('otherp2@test.com', 'password123')
        data = {"results": [{"exercise_id": self.exercise.id, "order": 1, "reps": 5, "accuracy": 90, "duration": 60}]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_complete_session_invalid_exercise(self):
        """Cannot submit results for exercises not in the plan."""
        plan = RehabPlan.objects.create(doctor=self.doctor, patient=self.patient, name="Test Plan")
        # Plan has NO exercises
        session = ExerciseSession.objects.create(patient=self.patient, plan=plan)
        url = reverse('complete-session', kwargs={'pk': session.id})
        
        data = {
            "results": [
                {
                    "exercise_id": self.exercise.id, # Exercise not in plan
                    "order": 1,
                    "reps": 8,
                    "accuracy": 85.5,
                    "duration": 120.0
                }
            ]
        }
        
        self.authenticate('patient@test.com', 'password123')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], "Submitted results include exercises not assigned in this plan.")
        self.assertIn(self.exercise.id, [int(eid) for eid in response.data['exercise_ids']])




