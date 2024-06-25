from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .forms import SignUpForm
from lobby.models import User
from django.utils.decorators import async_only_middleware
import json

# @csrf_exempt

@require_http_methods(["GET"])
async def login(scope, receive, send):
    # await asyncio.sleep(1)  # 비동기 작업 예시
    await send 
# def login(scope):
#     async def asgi(receive, send):
#         await send(
#             {
#                 "type": "http.response.start",
#                 "status": 200,
#                 "headers": [[b"content-type", b"text/plain"]],
#             }
#         )
#         await send({"type": "http.response.body", "body": b"Hello, world!"})

#     return asgi

@require_http_methods(["POST"])
async def signup(request):
    try:
        # 비동기적으로 요청 본문 읽기
        body = await request.body
        body_data = body.decode('utf-8')
        
        # JSON 데이터 파싱
        data = json.loads(body_data)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    # temp = await request.read()
    # print("DD" , temp)
    # print("ddd" , request.body.decode("utf-8"))
    # data = json.loads(request.body.decode('utf-8'))
    # except json.JSONDecodeError:
    #     return JsonResponse({"error": "Invalid JSON"}, status=400)

    # 데이터에서 사용자 정보 추출
    # username = data.get('username')
    # nickname = data.get('nickname')
    # password = data.get('password')
    # print(username)
    # print(nickname)
    # print(password)
    # print(request.POST('username'))
    # user = User.objects.create(username=request.POST['username'],
    #                         password=request.POST['password'],
    #                         email=request.POST['email'],)
    # print(user)
    # form = SignUpForm(request.POST)
    # if form.is_valid():
    #     user = form.save()
    #     return JsonResponse({"user_id": user.id}, status=201)
    # else:
    return JsonResponse({"errors": "euijin"}, status=400)