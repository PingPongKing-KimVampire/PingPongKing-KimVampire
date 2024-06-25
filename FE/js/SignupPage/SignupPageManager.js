class SignupPageManager {
	constructor(app, clientInfo) {
		console.log("Sign up Page!");

		this.clientInfo = clientInfo;
		app.innerHTML = this._getHTML();

		this._initPage();
	}

	_initPage() {
		this.idValidState = false;
		this.pwValidState = false;
		this.rePwValidState = false;
		this.nickNameValidState = false;

		this.idInput = document.querySelector('#idInput');
		this.idInput.addEventListener('input', () => {
			this._checkId();
			this._updateSignupButton();
		});
		this.pwInput = document.querySelector('#pwInput');
		this.pwInput.addEventListener('input', () => {
			this._checkPw();
			this._updateSignupButton();
		});
		this.rePwInput = document.querySelector('#rePwInput');
		this.rePwInput.addEventListener('input', () => {
			this._checkRePw();
			this._updateSignupButton();
		});
		this.nickNameInput = document.querySelector('#nickNameInput');
		this.nickNameInput.addEventListener('input', () => {
			this._checkNickName();
			this._updateSignupButton();
		});

		this.idWarning = document.querySelector('#idWarning');
		this.pwWarning = document.querySelector('#pwWarning');
		this.rePwWarning = document.querySelector('#rePwWarning');
		this.nickNameWarning = document.querySelector('#nickNameWarning');

		this.signupButton = document.querySelector('#signupButton');
		this.signupButton.disabled = true;
		this.signupButton.addEventListener('click', this._signupButtonClicked);
	}

	_checkId = () => {
		if (!this._validateId(this.idInput.value)) {
			const invalidIdMessage = "1에서 20자의 영문, 숫자만 사용 가능합니다.";
			this.idWarning.textContent = invalidIdMessage;
			this.idValidState = false;
			return;
		}
		//아이디 중복검사
		this.idValidState = true;
		this.idWarning.textContent = "";
	}
	_checkPw = () => {
		if (!this._validatePw(this.pwInput.value)) {
			const invalidPwMessage =
				"8에서 20자로 영문, 숫자, 특수문자를 모두 포함해야 합니다.";
				this.pwWarning.textContent = invalidPwMessage;
			this.pwValidState = false;
			return;
		}
		this.pwValidState = true;
		this.pwWarning.textContent = "";
	}
	_checkRePw = () => {
		if (!this._validateRePw(this.pwInput.value, this.rePwInput.value)) {
			const invalidRePwMessage = "비밀번호와 일치하지 않습니다.";
			this.rePwWarning.textContent = invalidRePwMessage;
			this.rePwValidState = false;
			return;
		}
		this.rePwValidState = true;
		this.rePwWarning.textContent = "";
	}
	_checkNickName = () => {
		if (!this._validateNickName(this.nickNameInput.value)) {
			const invalidNickNameMessage =
				"1에서 20자의 영문, 숫자, 한글만 사용 가능합니다.";
			this.nickNameWarning.textContent = invalidNickNameMessage;
			this.nickNameValidState = false;
			return;
		}
		//아이디 중복검사
		this.nickNameValidState = true;
		this.nickNameWarning.textContent = "";
	}

	_validateId(id) {
		const regex = /^[A-Za-z0-9]{1,20}$/;
		return regex.test(id);
	}

	_validateNickName(nickName) {
		const regex = /^[A-Za-z가-힣0-9]{1,20}$/;
		return regex.test(nickName);
	}

	_validatePw(password) {
		const regex =
			/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:">?<,\-./;'[\]\\|])[A-Za-z\d!@#$%^&*()_+{}:">?<,\-./;'[\]\\|]{8,20}$/;
		return regex.test(password);
	}

	_validateRePw(password, passwordConfirm) {
		return password === passwordConfirm;
	}

	_signupButtonClicked = () => {
		console.log("회원가입 버튼이 클릭됨");
	}

	_updateSignupButton = () => {
		if (
			this.idValidState &&
			this.pwValidState &&
			this.rePwValidState &&
			this.nickNameValidState
		) {
			this.signupButton.classList.add('generalButton');
			this.signupButton.classList.remove('disabledButton');
			this.signupButton.disabled = false;
		} else {
			this.signupButton.classList.remove('generalButton');
			this.signupButton.classList.add('disabledButton');
			this.signupButton.disabled = true;
		}
	}

	_getHTML() {
		return `
			<div id="container">
				<div class="inputContainer">
					${this._getIdContainerHTML()}
				</div>
				<div class="inputContainer">
					${this._getPwContainerHTML()}
				</div>
				<div class="inputContainer">
					${this._getRePwContainerHTML()}
				</div>
				<div class="inputContainer">
					${this._getNickNameContainerHTML()}
				</div>
			</div>
			<button id="signupButton" class="disabledButton">회원가입</button>
		`;
	}
	_getIdContainerHTML() { // TODO : 추후에 하나의 함수로 합쳐도 될 듯
		return `
			<label class="label" for="idInput"">아이디</label>
			<input class="input" type="text" id="idInput">
			<div class="warning" id="idWarning"></div>
		`;
	}
	_getPwContainerHTML() {
		return `
			<label class="label" for="pwInput"">비밀번호</label>
			<input class="input" type="password" id="pwInput">
			<div class="warning" id="pwWarning"></div>
		`;
	}
	_getRePwContainerHTML() {
		return `
			<label class="label" for="rePwInput">비밀번호 재입력</label>
			<input class="input" type="password" id="rePwInput">
			<div class="warning" id="rePwWarning"></div>
		`;
	}
	_getNickNameContainerHTML() {
		return `
			<label class="label" for="nickNameInput">닉네임</label>
			<input class="input" type="text" id="nickNameInput">
			<div class="warning" id="nickNameWarning"></div>
		`;
	}

}

export default SignupPageManager;