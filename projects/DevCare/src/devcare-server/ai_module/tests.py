from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import ExerciseSession

User = get_user_model()

class AIModuleAPITests(APITestCase):
    def setUp(self):
        # Create a doctor
        self.doctor = User.objects.create_user(
            email='doctor_ai@test.com',
            username='doctor_ai',
            password='password123',
            role='doctor'
        )
        # Create a patient
        self.patient = User.objects.create_user(
            email='patient_ai@test.com',
            username='patient_ai',
            password='password123',
            role='patient'
        )
        
        self.login_url = reverse('login')
        self.upload_url = reverse('upload-session')

    def authenticate(self, email, password):
        response = self.client.post(self.login_url, {
            'email': email,
            'password': password
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_upload_session_as_patient(self):
        """Patient can upload their own session results."""
        self.authenticate('patient_ai@test.com', 'password123')
        data = {
            "exercise": "bicep curl",
            "reps": 10,
            "avg_range": 130.5,
            "form_accuracy": 88.0,
            "duration": 45.0
        }
        response = self.client.post(self.upload_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'saved')
        self.assertEqual(ExerciseSession.objects.count(), 1)
        self.assertEqual(ExerciseSession.objects.first().patient, self.patient)

    def test_upload_session_as_doctor(self):
        """Doctor can upload session results for a patient."""
        self.authenticate('doctor_ai@test.com', 'password123')
        data = {
            "patient_id": self.patient.id,
            "exercise": "shoulder abduction",
            "reps": 12,
            "avg_range": 90.0,
            "form_accuracy": 95.0,
            "duration": 60.0
        }
        response = self.client.post(self.upload_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExerciseSession.objects.count(), 1)
        self.assertEqual(ExerciseSession.objects.first().patient, self.patient)

    def test_upload_session_doctor_missing_patient(self):
        """Doctor must provide patient_id."""
        self.authenticate('doctor_ai@test.com', 'password123')
        data = {
            "exercise": "bicep curl",
            "reps": 10,
            "avg_range": 130.5,
            "form_accuracy": 88.0,
            "duration": 45.0
        }
        response = self.client.post(self.upload_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("patient_id is required", response.data['detail'])

    def test_upload_session_invalid_exercise(self):
        """Exercise name is required."""
        self.authenticate('patient_ai@test.com', 'password123')
        data = {
            "exercise": "",
            "reps": 10,
            "avg_range": 130.5,
            "form_accuracy": 88.0,
            "duration": 45.0
        }
        response = self.client.post(self.upload_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exercise is required", response.data['detail'])
