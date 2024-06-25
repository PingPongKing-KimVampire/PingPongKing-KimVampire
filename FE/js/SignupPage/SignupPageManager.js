class SignupPageManager {
	constructor(app, clientInfo) {
		console.log("Sign up Page!");

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;

		this._initPage();
	}

	_initPage() {
		this.idInput = document.querySelector('#idInput');
		this.idInput.addEventListener('change', this._idInputFocusOut);
		this.pwInput = document.querySelector('#pwInput');
		this.pwInput.addEventListener('input', this._pwInputChanged);
		this.rePwInput = document.querySelector('#rePwInput');
		this.rePwInput.addEventListener('input', this._rePwInputChanged);
		this.nickNameInput = document.querySelector('#nickNameInput');
		this.nickNameInput.addEventListener('change', this._nickNameInputChanged);

		this.idWarning = document.querySelector('#idWarning');
		this.pwWarning = document.querySelector('#pwWarning');
		this.rePwWarning = document.querySelector('#rePwWarning');
		this.nickNameWarning = document.querySelector('#nickNameWarning');

		this.signupButton = document.querySelector('#signupButton');
		this.signupButton.disabled = true;
		this.signupButton.addEventListener('click', this._signupButtonClicked);
	}

	// TODO : 모두 유효한 상태에서 change 이벤트 인풋을 수정하는 경우, 여전히 signup 버튼이 활성화되어 있는 문제가 있다.
	// change 이벤트 인풋에 focus on 되는 순간, 일단 signup 버튼을 비활성화하면 어떨까?

	_idInputFocusOut = (event) => {
		console.log("id 인풋 업데이트됨: ", event.target.value);
		this._validate();
	}
	_pwInputChanged = (event) => {
		console.log("pw 인풋이 업데이트됨: ", event.target.value);
		this._validate();
	}
	_rePwInputChanged = (event) => {
		console.log("rePw 인풋이 업데이트됨: ", event.target.value);
		this._validate();
	}
	_nickNameInputChanged = (event) => {
		console.log("nickname 인풋이 업데이트됨: ", event.target.value);
		this._validate();
	}
	_validate() {
		if (this.idInput.value !== "" && this.pwInput.value !== "" && 
			this.rePwInput.value !== "" && this.nickNameInput.value !== "") {
			this.signupButton.classList.remove('disabledButton');
			this.signupButton.classList.add('generalButton');
		} else {
			this.signupButton.classList.add('disabledButton');
			this.signupButton.classList.remove('generalButton');
		}
	}

	_signupButtonClicked = () => {
		console.log("회원가입 버튼이 클릭됨");
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
					${this._getNicknameContainerHTML()}
				</div>
			</div>
			<button id="signupButton" class="disabledButton">회원가입</button>
		`;
	}
	_getIdContainerHTML() { // TODO : 추후에 하나의 함수로 합쳐도 될 듯
		return `
			<label class="label" for="idInput"">아이디</label>
			<input class="input" type="text" id="idInput">
			<div class="warning invisible" id="idWarning">5에서 10자의 영문소문자, 숫자만 사용 가능합니다.</div>
		`;
	}
	_getPwContainerHTML() {
		return `
			<label class="label" for="pwInput"">비밀번호</label>
			<input class="input" type="text" id="pwInput">
			<div class="warning invisible" id="pwWarning">5에서 10자의 영문소문자, 숫자만 사용 가능합니다.</div>
		`;
	}
	_getRePwContainerHTML() {
		return `
			<label class="label" for="rePwInput">비밀번호 재입력</label>
			<input class="input" type="text" id="rePwInput">
			<div class="warning invisible" id="rePwWarning">5에서 10자의 영문소문자, 숫자만 사용 가능합니다.</div>
		`;
	}
	_getNicknameContainerHTML() {
		return `
			<label class="label" for="nickNameInput">닉네임</label>
			<input class="input" type="text" id="nickNameInput">
			<div class="warning invisible" id="nickNameWarning">5에서 10자의 영문소문자, 숫자만 사용 가능합니다.</div>
		`;
	}

}

export default SignupPageManager;