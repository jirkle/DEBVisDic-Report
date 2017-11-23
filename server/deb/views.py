from django.db.models import Count
from django.shortcuts import render
from django.http import HttpResponse

from django.db import models
from deb.models import Edit
from deb.models import User
from deb.models import Edit_meta
import json


def index(request):
    return HttpResponse("Hello, DEBVisDic Report here!")


def create_edit(request):
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        user = body['edited_by']
        email = user['email']
        actions = body['actions']

        if not actions:
            return HttpResponse("no_actions")

        edit_name = body['edit_name']
        dictionary = body['dictionary']
        ili = body['ili']
        pwn_id = body['pwn_id']

        user_from_db = None
        edit_meta = None
        array = []
        try:
            user_from_db = User.objects.get(pk=email)
        except:
            new_user = User(name=user['name'], email=user['email'], role=user['role'])
            new_user.save()
            edit_meta = Edit_meta(edited_by=new_user, edit_name=edit_name, dictionary=dictionary, ili=ili,
                                  pwn_id=pwn_id)
            edit_meta.save()

            for item in actions:
                edit = Edit(edit_meta=edit_meta,
                            edit_value=item['edit_value'],
                            field_of_edit=item['field_of_edit'],
                            edit_type=item['edit_type'], edit_status=item['edit_status'], edit_xpath=item['edit_xpath'])
                edit.save()
                array.append(edit)

        if user_from_db is not None:
            edit_meta = Edit_meta(edited_by=user_from_db, edit_name=edit_name, dictionary=dictionary, ili=ili,
                                  pwn_id=pwn_id)
            edit_meta.save()

            for item in actions:
                edit = Edit(edit_meta=edit_meta,
                            edit_value=item['edit_value'],
                            field_of_edit=item['field_of_edit'],
                            edit_type=item['edit_type'], edit_status=item['edit_status'], edit_xpath=item['edit_xpath'])
                edit.save()
                array.append(edit)

        return HttpResponse(str(edit_meta.as_json()))


def get_all_edits(request):
    if request.method == 'GET':
        pwn_id = str(request.GET.get('pwn_id', ''))
        dictionary = str(request.GET.get('dictionary', ''))

        field = str(request.GET.get('field', ''))
        type_deb = str(request.GET.get('type', ''))
        edit_status = str(request.GET.get('edit_status', ''))

        pwn_id = pwn_id.replace("\"", "")
        dictionary = dictionary.replace("\"", "")
        field = field.replace("\"", "")
        type_deb = type_deb.replace("\"", "")
        edit_status = edit_status.replace("\"", "")

        editations = Edit.objects.select_related().exclude(deleted=True)
        if pwn_id is not '':
            editations = editations.filter(edit_meta__pwn_id__exact=pwn_id)
        if dictionary is not '':
            editations = editations.filter(edit_meta__dictionary__exact=dictionary)
        if field is not '':
            editations = editations.filter(field_of_edit__exact=field)
        if type_deb is not '':
            editations = editations.filter(edit_type__exact=type_deb)
        if edit_status is not '':
            editations = editations.filter(edit_status__exact=edit_status)
        metas = set()

        for edit in editations:
            metas.add(edit.edit_meta)
        results = []
        for m in metas:
            tmp = []
            items = editations.filter(edit_meta_id__exact=m.id)
            tmp.append(m.as_json())
            for i in items:
                tmp.append(i.as_json_no_meta())
            results.append(tmp)
        return HttpResponse(json.dumps(results), content_type="application/json")


def get_all_edits_by_meta_id(request):
    if request.method == 'GET':
        request_id = request.GET.get('id', '')

        data = Edit.objects.select_related().filter(edit_meta_id=request_id).exclude(deleted=True)
        edit_meta = Edit_meta.objects.get(id=request_id)

        results = [ob.as_json_no_meta() for ob in data]
        results.append(edit_meta.as_json())

        return HttpResponse(json.dumps(results), content_type="application/json")


def change_status_meta(request):
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        user = body['edited_by']
        meta_ids_0 = body['meta_ids_0']
        meta_ids_1 = body['meta_ids_1']

        try:
            used_user = User.objects.get(email=user['email'])
        except:
            used_user = User(name=user['name'], email=user['email'], role=user['role'])
            used_user.save()

        try:

            for item in meta_ids_0:
                edits = Edit.objects.select_related().filter(edit_meta_id=item)
                for obj in edits:
                    obj.edit_status = 0
                    obj.status_check_by = used_user.email
                    obj.edit_status_time_stamp = models.DateTimeField(auto_now=True)
                    obj.save()

            for item in meta_ids_1:
                edits = Edit.objects.select_related().filter(edit_meta_id=item)
                for obj in edits:
                    obj.edit_status = 1
                    obj.status_check_by = used_user.email
                    obj.save()
        except:

            return HttpResponse('Not existing ID')

        return HttpResponse('')


def change_status_edit(request):
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        user = body['edited_by']
        try:
            status_0_ids = body['status_0']
        except:
            status_0_ids = []
        try:
            status_1_ids = body['status_1']
        except:
            status_1_ids = []
        try:
            status_2_ids = body['status_2']
        except:
            status_2_ids = []

        try:
            used_user = User.objects.get(email=user['email'])
        except:
            used_user = User(name=user['name'], email=user['email'], role=user['role'])
            used_user.save()

        try:
            ids = set()
            for item in status_0_ids:
                ids.add(item["id"])
            for item in status_1_ids:
                ids.add(item["id"])
            for item in status_2_ids:
                ids.add(item["id"])
            edits = Edit.objects.filter(id__in=ids)
            if len(edits) == len(ids):
                for item in status_0_ids:
                    edit = Edit.objects.get(id__exact=item["id"])
                    edit.status_check_by = used_user.email
                    edit.edit_status = 0
                    edit.edit_status_time_stamp = models.DateTimeField(auto_now=True)
                    try:
                        edit.edit_value = item["edit_value"]
                    except:
                        pass
                    try:
                        edit.edit_xpath = item["edit_xpath"]
                    except:
                        pass
                    edit.save()
                for item in status_1_ids:
                    edit = Edit.objects.get(id__exact=item["id"])
                    edit.status_check_by = used_user.email
                    edit.edit_status = 1
                    edit.edit_status_time_stamp = models.DateTimeField(auto_now=True)
                    try:
                        edit.edit_value = item["edit_value"]
                    except:
                        pass
                    try:
                        edit.edit_xpath = item["edit_xpath"]
                    except:
                        pass
                    edit.save()
                for item in status_2_ids:
                    edit = Edit.objects.get(id__exact=item["id"])
                    edit.status_check_by = used_user.email
                    edit.edit_status = 2
                    edit.edit_status_time_stamp = models.DateTimeField(auto_now=True)
                    try:
                        edit.edit_value = item["edit_value"]
                    except:
                        pass
                    try:
                        edit.edit_xpath = item["edit_xpath"]
                    except:
                        pass
                    edit.save()
                return HttpResponse('')
            else:
                return HttpResponse('Not existing ID')
        except:
            return HttpResponse('Not existing ID')


def get_options(request):
    if request.method == 'GET':
        result = []
        try:
            tmp = Edit.objects.values('field_of_edit').annotate(count=Count('field_of_edit'))
            for i in tmp:
                result.append(i)
        except:
            return HttpResponse('error')

        return HttpResponse(str(result))


def mark_as_deleted(request):
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        request_id = body['id']

        try:
            to_be_deleted = Edit.objects.get(id=request_id)
            if to_be_deleted.deleted:
                return HttpResponse('Already deleted')
        except:
            return HttpResponse('Not existing ID')

        to_be_deleted.deleted = True
        to_be_deleted.save()
        try:
            edit_meta = Edit_meta.objects.get(id=to_be_deleted.edit_meta.id)
        except:
            return HttpResponse('Not existing Edit_meta ID')

        results = Edit.objects.all().filter(edit_meta=edit_meta).exclude(deleted=True)
        if results.__len__() is 0:
            edit_meta.deleted = True
            edit_meta.save()

        return HttpResponse("OK")
