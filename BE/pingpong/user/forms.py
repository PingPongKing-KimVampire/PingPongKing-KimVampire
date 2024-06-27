from django import forms
from lobby.models import User
from utils.printer import Printer

class SignUpForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'password', 'nickname']

    # 폼에서 비밀번호 해싱하기
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user
