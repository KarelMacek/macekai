import pytest
from django.core.files.base import ContentFile

from assessments.models import FileBlob
from assessments.storage import PostgresFileStorage


@pytest.mark.django_db
def test_save_and_open_roundtrip():
    storage = PostgresFileStorage()
    name = storage.save("uploads/example.pdf", ContentFile(b"hello world"))

    assert storage.exists(name)
    assert storage.size(name) == len(b"hello world")
    with storage.open(name) as f:
        assert f.read() == b"hello world"


@pytest.mark.django_db
def test_delete_removes_blob_row():
    storage = PostgresFileStorage()
    name = storage.save("uploads/gone.txt", ContentFile(b"bye"))

    storage.delete(name)

    assert not storage.exists(name)
    assert not FileBlob.objects.filter(name=name).exists()


@pytest.mark.django_db
def test_get_available_name_avoids_collision():
    storage = PostgresFileStorage()
    first = storage.save("uploads/dup.txt", ContentFile(b"one"))
    second = storage.save("uploads/dup.txt", ContentFile(b"two"))

    assert first != second
    assert FileBlob.objects.count() == 2
