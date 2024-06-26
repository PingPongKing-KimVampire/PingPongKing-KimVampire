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
		this.completeButton = document.querySelector('#completeButton');
		this.completeButton.disabled = true;
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
					<div id="warning">중복된 닉네임입니다.</div>
				</div>
			</div>
			<button id="completeButton" class="disabledButton">완료</button>
		`;
	}
}

export default EditProfilePageManager;