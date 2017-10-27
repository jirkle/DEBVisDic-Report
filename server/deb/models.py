from django.db import models


class Edit(models.Model):
    OPERATIONS = (
        (0, 'Modify'),
        (1, 'Add'),
        (2, 'Delete')
    )

    STATUS = (
        (0, 'Rejected'),
        (1, 'Accepted'),
        (2, 'Waiting')
    )

    id = models.AutoField(primary_key=True)
    edit_meta = models.ForeignKey('Edit_meta', on_delete=models.CASCADE, null=True)
    edit_value = models.CharField(max_length=1024)
    edit_type = models.IntegerField(choices=OPERATIONS)
    edit_status = models.IntegerField(choices=STATUS)
    edit_xpath = models.CharField(max_length=1024)
    status_check_by = models.CharField(max_length=200, null=True)
    field_of_edit = models.CharField(max_length=256)
    edit_status_time_stamp = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def as_json(self):
        return dict(
            id=self.id,
            edit_meta=self.edit_meta.as_json(),
            edit_value=self.edit_value,
            field_of_edit=self.field_of_edit,
            edit_type=self.edit_type,
            edit_status=self.edit_status,
            edit_xpath=self.edit_xpath,
            edit_status_time_stamp=self.edit_status_time_stamp.isoformat())

    def as_json_no_meta(self):
        return dict(
            id=self.id,
            edit_value=self.edit_value,
            field_of_edit=self.field_of_edit,
            edit_type=self.edit_type,
            edit_status=self.edit_status,
            edit_xpath=self.edit_xpath,
            edit_status_time_stamp=self.edit_status_time_stamp.isoformat())


class Edit_meta(models.Model):
    id = models.AutoField(primary_key=True)
    edit_name = models.CharField(max_length=1024)
    dictionary = models.CharField(max_length=200)
    edited = models.DateTimeField(auto_now=True)
    ili = models.CharField(max_length=200)
    pwn_id = models.CharField(max_length=200)
    edited_by = models.ForeignKey('User', on_delete=models.CASCADE, null=True)
    deleted = models.BooleanField(default=False)

    def as_json(self):
        return dict(
            id=self.id,
            ili=self.ili,
            pwn_id=self.pwn_id,
            edited_by=self.edited_by.as_json(),
            edited=self.edited.isoformat(),
            edit_name=self.edit_name,
            dictionary=self.dictionary)


class User(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=200, unique=True, primary_key=True)
    role = models.CharField(max_length=200)

    def as_json(self):
        return dict(
            name=self.name,
            email=self.email,
            role=self.role)
