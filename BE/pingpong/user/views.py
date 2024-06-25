from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
@require_http_methods(["POST"])
def signup(request):
    try:
        body = request.body.decode('utf-8')
        data = json.loads(body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # 여기서 data를 사용하여 추가 작업을 수행할 수 있습니다.
    # 예를 들어, 회원가입 처리를 할 수 있습니다.

    return JsonResponse({"message": "Signup successful"}, status=200)



@require_http_methods(["POST"])
def login(request):
    # if request.method == 'POST':
        # 요청 본문을 문자열로 디코딩
    body_unicode = request.body.decode('utf-8')
    # 문자열로 된 본문을 로그에 출력 (디버깅용)
    print("Request body:", body_unicode)
    
    # # JSON 데이터를 파싱 (필요한 경우)
    # body_data = json.loads(body_unicode)
    
    # 로그인 처리 로직
    # 예: body_data에서 필요한 데이터를 사용하여 인증 로직 구현
    return JsonResponse({"message": "Login successful"})
    
    # return JsonResponse({"error": "Invalid request method"}, status=400)