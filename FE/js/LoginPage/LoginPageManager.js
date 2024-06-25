class LoginPageManager {
	constructor(app, clientInfo, onLoginSuccess, onEnterSignupPage) {
		console.log("Login Page!");

		this.clientInfo = clientInfo;
		this.onLoginSuccess = onLoginSuccess;
		this.onEnterSignupPage = onEnterSignupPage;
		app.innerHTML = this._getHTML();
	}

	initPage() {
		this.idInput = document.querySelector('#idInput');
		this.pwInput = document.querySelector('#pwInput');
		this.idInput.addEventListener('input', this._updateLoginButton.bind(this));
		this.pwInput.addEventListener('input', this._updateLoginButton.bind(this));
		
		this.loginButton = document.querySelector('#loginButton');
		this.loginButton.disabled = true;
		this.loginButton.addEventListener('click', this.onLoginSuccess);

		document.querySelector('#signupButton')
				.addEventListener('click', this.onEnterSignupPage);
	}

	_updateLoginButton() {
		if (this.idInput.value !== "" && this.pwInput.value !== "") {
			this.loginButton.disabled = false;
			this.loginButton.classList.remove('disabledButton');
			this.loginButton.classList.add('activatedButton');
		} else {
			this.loginButton.disabled = true;
			this.loginButton.classList.add('disabledButton');
			this.loginButton.classList.remove('activatedButton');
		}
	}

	_getHTML() {
		return `
			<div id="container">
				<img id="logoImg" src="images/logo.png">
				<form>
					<div id="inputContainer">
						<input class="input" type="text" id="idInput" placeholder="아이디를 입력해주세요.">
						<input class="input" type="password" id="pwInput" placeholder="비밀번호를 입력해주세요.">
					</div>
					<div id="buttonContainer">
						<button class="disabledButton" id="loginButton" type="button">로그인</button>
						<button id="signupButton" type="button">회원가입</button>
					</div>
				</form>
			</div>
		`;
	}
}

export default LoginPageManager;