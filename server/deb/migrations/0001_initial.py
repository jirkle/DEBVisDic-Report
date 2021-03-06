# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-09-11 19:24
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Edit',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('edit_value', models.CharField(max_length=1024)),
                ('edit_type', models.IntegerField(choices=[(0, b'Modify'), (1, b'Add'), (2, b'Delete')])),
                ('edit_status', models.IntegerField(choices=[(0, b'Rejected'), (1, b'Accepted'), (2, b'Waiting')])),
                ('edit_xpath', models.CharField(max_length=1024)),
                ('status_check_by', models.CharField(max_length=200, null=True)),
                ('field_of_edit', models.CharField(max_length=256)),
            ],
        ),
        migrations.CreateModel(
            name='Edit_meta',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('edit_name', models.CharField(max_length=1024)),
                ('dictionary', models.CharField(max_length=200)),
                ('edited', models.DateTimeField(auto_now=True)),
                ('ili', models.CharField(max_length=200)),
                ('pwn_id', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('name', models.CharField(max_length=200)),
                ('email', models.CharField(max_length=200, primary_key=True, serialize=False, unique=True)),
                ('role', models.CharField(max_length=200)),
            ],
        ),
        migrations.AddField(
            model_name='edit_meta',
            name='edited_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='deb.User'),
        ),
        migrations.AddField(
            model_name='edit',
            name='edit_meta',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='deb.Edit_meta'),
        ),
    ]
