from django.http import HttpResponsePermanentRedirect
from django.urls import resolve, Resolver404

class AddSlashMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.endswith('/'):
            new_path = request.path + '/'
            try:
                resolve(new_path)
                request.path_info = new_path
            except Resolver404:
                pass
        response = self.get_response(request)
        return response
