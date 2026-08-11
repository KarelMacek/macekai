from django.urls import path

from . import views

urlpatterns = [
    path("journey/", views.JourneyView.as_view(), name="assessments-journey"),
    path("tests/<slug:slug>/", views.TestDetailView.as_view(), name="assessments-test-detail"),
    path("tests/<slug:slug>/submit/", views.TestSubmitView.as_view(), name="assessments-test-submit"),
    path("submissions/", views.SubmissionListView.as_view(), name="assessments-submission-list"),
    path(
        "submissions/<int:pk>/",
        views.SubmissionDetailView.as_view(),
        name="assessments-submission-detail",
    ),
    path(
        "feedback-request/",
        views.FeedbackRequestView.as_view(),
        name="assessments-feedback-request",
    ),
    path("feedback/", views.FeedbackView.as_view(), name="assessments-feedback"),
    path("files/<int:blob_id>/", views.FileDownloadView.as_view(), name="assessments-file-download"),
    path("diagnostics/", views.DiagnosticsListView.as_view(), name="assessments-diagnostics-list"),
    path(
        "diagnostics/<int:pk>/",
        views.DiagnosticsDetailView.as_view(),
        name="assessments-diagnostics-detail",
    ),
    path(
        "admin/diagnostics/",
        views.AdminDiagnosticsListView.as_view(),
        name="assessments-admin-diagnostics-list",
    ),
    path(
        "admin/diagnostics/<int:pk>/",
        views.AdminDiagnosticsDetailView.as_view(),
        name="assessments-admin-diagnostics-detail",
    ),
    path(
        "admin/feedback-requests/<int:pk>/feedback/",
        views.AdminFeedbackWriteView.as_view(),
        name="assessments-admin-feedback-write",
    ),
]
