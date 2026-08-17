from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0005_userconsent"),
    ]

    operations = [
        migrations.RenameField(
            model_name="journey",
            old_name="simpleshop_product_id",
            new_name="simpleshop_product_id_cs",
        ),
        migrations.AddField(
            model_name="journey",
            name="simpleshop_product_id_en",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="diagnostics",
            name="language",
            field=models.CharField(blank=True, default="", max_length=8),
        ),
    ]
