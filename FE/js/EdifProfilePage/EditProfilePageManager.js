class EditProfilePageManager {
	constructor(app, clientInfo) {
		this.clientInfo = clientInfo;

		// TODO : 임시 하드 코딩
		this.clientInfo.avatarUrl = 'images/playerA.png';
		this.clientInfo.nickname = '김뱀파이어';

		app.innerHTML = this._getHTML();
		this._initPage();
	}

	_initPage() {
		document.querySelector('#avatarEditButton')
				.addEventListener('click', this._editAvatar);
		this.avatarImg = document.querySelector('#avatarImg');

		this.nicknameInput = document.querySelector('#nicknameInput');
		this.nicknameInput.addEventListener('input', async () => {
			const nicknameValidState = await this._checkNickname();
			this._updateCompleteButton(nicknameValidState);
		});
		this.nicknameWarning = document.querySelector('#warning');

		this.completeButton = document.querySelector('#completeButton');
		this.completeButton.disabled = true;
		this.completeButton.addEventListener('click', this._completeEditProfile);
	}

	_editAvatar = () => {
		console.log("아바타 변경 모달 띄우기");
	}

	_checkNickname = async () => {
		if (!this._validateNickname(this.nicknameInput.value)) {
			const invalidNicknameMessage = 
				"1에서 20자의 영문, 숫자, 한글만 사용 가능합니다.";
			this.nicknameWarning.textContent = invalidNicknameMessage;
			return false;
		}
		if (!(await this._validateDuplicateNickname(this.nicknameInput.value))) {
			const duplicateNicknameMessage = "이미 존재하는 닉네임입니다.";
			this.nicknameWarning.textContent = duplicateNicknameMessage;
			this._updateCompleteButton(false);
			return false;
		}
		this.nicknameWarning.textContent = "";
		return true;
	}
	_validateNickname(nickname) {
		const regex = /^[A-Za-z가-힣0-9]{1,20}$/;
		return regex.test(nickname);
	}
	async _validateDuplicateNickname(nickName) {
		// const query = new URLSearchParams({ nickname: nickName }).toString();
		// const url = `http://${SERVER}:${PORT}/check-nickname?${query}`;
		// try {
		// 	const response = await fetch(url, {
		// 		method: 'GET',
		// 		headers: {
		// 			'Content-Type': 'application/json'
		// 		}
		// 	});
		// 	if (!response.ok) {
		// 		throw new Error(`HTTP error! status: ${response.status}`);
		// 	}
		// 	const data = await response.json();
		// 	return data.is_available;
		// } catch (error) {
		// 	console.error('Error:', error);
		// }
		return true;
	}

	_updateCompleteButton(abled) {
		if (abled && // 닉네임이 유효하고
			this.clientInfo.nickname !== this.nicknameInput.value && // 기존 닉네임, 아바타와 다른 경우에만 완료 버튼 활성화
			this.clientInfo.avatarUrl !== this.avatarImg.value) {
			this.completeButton.disabled = false;
			this.completeButton.classList.add('generalButton');
			this.completeButton.classList.remove("disabledButton");
		} else {
			this.completeButton.disabled = true;
			this.completeButton.classList.remove('generalButton');
			this.completeButton.classList.add("disabledButton");
		}
	}

	_completeEditProfile = () => {
		console.log("프로필 편집 완료, 서버에게 요청 보내기");
	}

	_getHTML() {
		return `
			<div id="container">
				<div id="avatarContainer">
					<div id="avatarImgFrame">
						<img id="avatarImg" src="${this.clientInfo.avatarUrl}">
					</div>
					<button id="avatarEditButton"></button>
				</div>
				<div id="nicknameContainer">
					<input id="nicknameInput" type="text" value="${this.clientInfo.nickname}">
					<div id="warning"></div>
				</div>
			</div>
			<button id="completeButton" class="disabledButton">완료</button>
		`;
	}
}

export default EditProfilePageManager;