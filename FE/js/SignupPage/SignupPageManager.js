const SERVER = "127.0.0.1";
const PORT = 3001;

class SignupPageManager {
	constructor(app, clientInfo, renderPage) {
		console.log("Sign up Page!");

		this.clientInfo = clientInfo;
		this.app = app;
		this.renderPage = renderPage;
	}

	connectPage() {}

	clearPage() {}

	initPage() {
		this.app.innerHTML = this._getHTML();
		this.idValidState = false;
		this.pwValidState = false;
		this.rePwValidState = false;
		this.nickNameValidState = false;

		this.idInput = document.querySelector("#idInput");
		this.idInput.addEventListener("input", async () => {
			await this._checkId();
			this._updateSignupButton();
		});
		this.pwInput = document.querySelector("#pwInput");
		this.pwInput.addEventListener("input", () => {
			this._checkPw();
			this._checkRePw();
			this._updateSignupButton();
		});
		this.rePwInput = document.querySelector("#rePwInput");
		this.rePwInput.addEventListener("input", () => {
			this._checkRePw();
			this._updateSignupButton();
		});
		this.nickNameInput = document.querySelector("#nickNameInput");
		this.nickNameInput.addEventListener("input", async () => {
			await this._checkNickName();
			this._updateSignupButton();
		});

		this.idWarning = document.querySelector("#idWarning");
		this.pwWarning = document.querySelector("#pwWarning");
		this.rePwWarning = document.querySelector("#rePwWarning");
		this.nickNameWarning = document.querySelector("#nickNameWarning");

		this.signupButton = document.querySelector("#signupButton");
		this.signupButton.disabled = true;
		this.signupButton.addEventListener("click", this._signUpUser);
	}

	_checkId = async () => {
		if (this.idInput.value === '') {
			this.idWarning.textContent = '';
			this.idValidState = false;
			return;
		}
		if (!this._validateId(this.idInput.value)) {
			const invalidIdMessage = "1에서 20자의 영문, 숫자만 사용 가능합니다.";
			this.idWarning.textContent = invalidIdMessage;
			this.idValidState = false;
			return;
		}
		try {
			if (!(await this._validateDuplicateId(this.idInput.value))) {
				const duplicateIdMessage = "이미 존재하는 아이디입니다.";
				this.idWarning.textContent = duplicateIdMessage;
				this.idValidState = false;
				return;
			}
		} catch (error) {
			if (error instanceof Error)
				this.idWarning.textContent = error.message;
			if (error instanceof TypeError && error.message === 'Failed to fetch')
				this.idWarning.textContent = "서버의 응답이 없습니다.";
			return;
		}
		this.idValidState = true;
		this.idWarning.textContent = "";
	};
	_checkPw = () => {
		if (this.pwInput.value === '') {
			this.pwWarning.textContent = '';
			this.pwValidState = false;
			return;
		}
		if (!this._validatePw(this.pwInput.value)) {
			const invalidPwMessage = "8에서 20자로 영문, 숫자, 특수문자를 모두 포함해야 합니다.";
			this.pwWarning.textContent = invalidPwMessage;
			this.pwValidState = false;
			return;
		}
		this.pwValidState = true;
		this.pwWarning.textContent = "";
	};
	_checkRePw = () => {
		if (this.rePwInput.value === '') {
			this.rePwWarning.textContent = '';
			this.rePwValidState = false;
			return;
		}
		if (!this._validateRePw(this.pwInput.value, this.rePwInput.value)) {
			const invalidRePwMessage = "비밀번호와 일치하지 않습니다.";
			this.rePwWarning.textContent = invalidRePwMessage;
			this.rePwValidState = false;
			return;
		}
		this.rePwValidState = true;
		this.rePwWarning.textContent = "";
	};
	_checkNickName = async () => {
		if (this.nickNameInput.value === '') {
			this.nickNameWarning.textContent = '';
			this.nickNameValidState = false;
			return;
		}
		if (!this._validateNickName(this.nickNameInput.value)) {
			const invalidNickNameMessage = "1에서 20자의 영문, 숫자, 한글만 사용 가능합니다.";
			this.nickNameWarning.textContent = invalidNickNameMessage;
			this.nickNameValidState = false;
			return;
		}
		try {
			if (!(await this._validateDuplicateNickName(this.nickNameInput.value))) {
				const duplicateNickNameMessage = "이미 존재하는 닉네임입니다.";
				this.nickNameWarning.textContent = duplicateNickNameMessage;
				this.nickNameValidState = false;
				return;
			}
		} catch (error) {
			if (error instanceof Error)
				this.nickNameWarning.textContent = error.message;
			if (error instanceof TypeError && error.message === 'Failed to fetch')
				this.nickNameWarning.textContent = "서버의 응답이 없습니다.";
			return;
		}
		this.nickNameValidState = true;
		this.nickNameWarning.textContent = "";
	};

	async _validateDuplicateId(id) {
		const query = new URLSearchParams({ username: id }).toString();
		const url = `http://${SERVER}:${PORT}/check-username?${query}`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			throw new Error('서버와의 연결이 불안정합니다.');
		}
		const data = await response.json();
		return data.is_available;
	}

	async _validateDuplicateNickName(nickName) {
		const query = new URLSearchParams({ nickname: nickName }).toString();
		const url = `http://${SERVER}:${PORT}/check-nickname?${query}`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			throw new Error('서버와의 연결이 불안정합니다.');
		}
		const data = await response.json();
		return data.is_available;
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
		const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:">?<,\-./;'[\]\\|])[A-Za-z\d!@#$%^&*()_+{}:">?<,\-./;'[\]\\|]{8,20}$/;
		return regex.test(password);
	}

	_validateRePw(password, passwordConfirm) {
		return password === passwordConfirm;
	}

	_signUpUser = async () => {
		const username = this.idInput.value;
		const nickname = this.nickNameInput.value;
		const password = this.pwInput.value;

		const userData = {
			username: username,
			nickname: nickname,
			password: password,
		};

		const url = `http://${SERVER}:${PORT}/signup`;

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});

			if (!response.ok) {
				let information = '';
				if (response.status === 409) {
					const responseData = await response.json(); 
					if (responseData.duplicated_item === 'id') {
						information = '이미 존재하는 아이디입니다.';
					} else if (responseData.duplicated_item === 'nickname') {
						information = '이미 존재하는 닉네임입니다.';
					}
				} else if (response.status >= 400 && response.status < 500) {
					information = '입력 내용이 유효하지 않습니다.';
				} else if (response.status >= 500) {
					information = '서버와의 연결이 불안정합니다.';
				}
				throw new Error(information);
			}

		} catch (error) {
			if (error instanceof Error)
				this._displaySignupFailureNotiWindow(error.message);
			if (error instanceof TypeError && error.message === 'Failed to fetch')
				this._displaySignupFailureNotiWindow("서버의 응답이 없습니다.");
		}


		// const data = await response.json();
		// console.log('회원가입 성공:', data);
		// 회원가입 성공 후 추가 작업 (예: 리디렉션)
		this.renderPage("login");
	};
	_displaySignupFailureNotiWindow(infomation) {
		const notiWindow = document.querySelector('.notiWindow');
		notiWindow.querySelector('.infomation').textContent = infomation;
		notiWindow.style.display = 'flex';

		const confirmButton = notiWindow.querySelector('.confirmButton');
		const listener = () => {
			confirmButton.removeEventListener('click', listener);
			notiWindow.style.display = 'none';
		}
		confirmButton.addEventListener('click', listener);
	}

	_updateSignupButton = () => {
		if (this.idValidState && this.pwValidState && this.rePwValidState && this.nickNameValidState) {
			this.signupButton.classList.add("generalButton");
			this.signupButton.classList.remove("disabledButton");
			this.signupButton.disabled = false;
		} else {
			this.signupButton.classList.remove("generalButton");
			this.signupButton.classList.add("disabledButton");
			this.signupButton.disabled = true;
		}
	};

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
			${this._getSignupFailureNotiWindowHTML()}
		`;
	}
	_getIdContainerHTML() {
		// TODO : 추후에 하나의 함수로 합쳐도 될 듯
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

	_getSignupFailureNotiWindowHTML() {
		return `
			<div class="notiWindow">
				<div class="infomation">이미 존재하는 아이디입니다.</div>
				<button class="confirmButton">확인</button>
			</div>
		`;
	}
}

export default SignupPageManager;
