from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.urls import reverse
from django.utils.deconstruct import deconstructible


@deconstructible
class PostgresFileStorage(Storage):
    """Stores uploaded file bytes as rows in the FileBlob table instead of local
    disk or Blob storage. Azure App Service's local filesystem isn't reliably
    persistent across restarts, and this avoids provisioning Blob storage for
    what's currently a handful of small CV/feedback documents. Postgres is
    already provisioned and durable in every environment.

    A real django.core.files.storage.Storage subclass, so FileField/admin
    widgets/DRF serializers work unmodified — swapping to django-storages +
    Azure Blob later only requires changing this file, not any model/migration.
    """

    def _open(self, name, mode="rb"):
        from .models import FileBlob

        blob = FileBlob.objects.get(name=name)
        return ContentFile(bytes(blob.data), name=name)

    def _save(self, name, content):
        from .models import FileBlob

        content.seek(0)
        data = content.read()
        FileBlob.objects.update_or_create(
            name=name,
            defaults={
                "data": data,
                "size": len(data),
                "original_filename": getattr(content, "name", "") or name,
                "content_type": getattr(content, "content_type", "") or "",
            },
        )
        return name

    def exists(self, name):
        from .models import FileBlob

        return FileBlob.objects.filter(name=name).exists()

    def size(self, name):
        from .models import FileBlob

        return FileBlob.objects.get(name=name).size

    def delete(self, name):
        from .models import FileBlob

        FileBlob.objects.filter(name=name).delete()

    def url(self, name):
        from .models import FileBlob

        try:
            blob_id = FileBlob.objects.only("id").get(name=name).id
        except FileBlob.DoesNotExist:
            return ""
        return reverse("assessments-file-download", kwargs={"blob_id": blob_id})
