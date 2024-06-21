from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def sample_view(request):
    data = {
        "name": "hi"
    }
    return JsonResponse(data)