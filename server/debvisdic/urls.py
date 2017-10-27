"""debvisdic URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from deb import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^$', views.index, name='index'),
    url(r'^create_edit/', views.create_edit, name='create_edit'),
    url(r'^get_all_edits/', views.get_all_edits, name='get_all_edits'),
    url(r'^get_all_edits_by_meta_id/', views.get_all_edits_by_meta_id, name='get_all_edits_by_meta_id'),
    url(r'^change_status_meta/', views.change_status_meta, name='change_status_meta'),
    url(r'^change_status_edit/', views.change_status_edit, name='change_status_edit'),
    url(r'^get_options/', views.get_options, name='get_options'),
    url(r'^mark_deleted/', views.mark_as_deleted, name='mark_deleted'),
]
