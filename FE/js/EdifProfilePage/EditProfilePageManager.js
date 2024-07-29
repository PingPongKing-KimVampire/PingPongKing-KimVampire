import { SERVER_ADDRESS } from "../PageRouter.js";
import { SERVER_PORT } from "../PageRouter.js";
import { GlobalConnectionError, isSocketConnected } from "../Error/Error.js";

class EditProfilePageManager {
	constructor(app, clientInfo, renderPage) {
		this.clientInfo = clientInfo;
		this._setDefaultAvatars();
		app.innerHTML = this._getHTML();
		this.renderPage = renderPage;
	}

	_setDefaultAvatars() {
		this._addDefaultAvatar("images/playerA.png");
		this._addDefaultAvatar("images/vampireIcon.png");
		this._addDefaultAvatar("images/playerC.svg");
		this._addDefaultAvatar("images/humanIcon.png");
		this._addDefaultAvatar("images/playerB.png");
	}
	_addDefaultAvatar(avatarPath) {
		if (!this._defaultAvatarPathList) this._defaultAvatarPathList = [];
		this._defaultAvatarPathList.push(avatarPath);
	}

	async connectPage() {
		if (isSocketConnected(this.clientInfo?.socket)) throw new GlobalConnectionError();
	}

	clearPage() {}

	initPage() {
		this.isNicknameUpdated = false;
		this.isAvatarUpdated = false;
		this.isDefaultAvatar;

		this.avatarImg = document.querySelector("#avatarImg");

		this.nicknameInput = document.querySelector("#nicknameInput");
		this.nicknameInput.addEventListener("input", async () => {
			this.isNicknameUpdated = await this._checkNickname();
			this._updateCompleteButton(this.isNicknameUpdated, this.isAvatarUpdated);
		});
		this.nicknameWarning = document.querySelector("#warning");

		this.completeButton = document.querySelector("#completeButton");
		this.completeButton.disabled = true;
		this.completeButton.addEventListener("click", this._completeEditProfile);

		this._initAvatarSelectionModal();
		this._initExitModal();
	}

	_checkNickname = async () => {
		if (this.nicknameInput.value === "" || this.nicknameInput.value === this.clientInfo.nickname) {
			this.nicknameWarning.textContent = "";
			return false;
		}
		if (!this._validateNickname(this.nicknameInput.value)) {
			const invalidNicknameMessage = "1에서 20자의 영문, 숫자, 한글만 사용 가능합니다.";
			this.nicknameWarning.textContent = invalidNicknameMessage;
			return false;
		}
		try {
			if (!(await this._validateDuplicateNickname(this.nicknameInput.value))) {
				const duplicateNicknameMessage = "이미 존재하는 닉네임입니다.";
				this.nicknameWarning.textContent = duplicateNicknameMessage;
				return false;
			}
		} catch (error) {
			if (error instanceof Error) this.nicknameWarning.textContent = error.message;
			if (error instanceof TypeError && error.message === `Failed to fetch`) this.nicknameWarning.textContent = "서버의 응답이 없습니다.";
			return;
		}
		this.nicknameWarning.textContent = "";
		return true;
	};
	_validateNickname(nickname) {
		const regex = /^[A-Za-z가-힣0-9]{1,20}$/;
		return regex.test(nickname);
	}
	async _validateDuplicateNickname(nickName) {
		const query = new URLSearchParams({ nickname: nickName }).toString();
		const url = `http://${SERVER_ADDRESS}:${SERVER_PORT}/check-nickname?${query}`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			throw new Error("서버와의 연결이 불안정합니다.");
		}
		const data = await response.json();
		return data.is_available;
	}

	_updateCompleteButton(isNicknameUpdated, isAvatarUpdated) {
		if (isNicknameUpdated || isAvatarUpdated) {
			this.completeButton.disabled = false;
			this.completeButton.classList.add("generalButton");
			this.completeButton.classList.remove("disabledButton");
		} else {
			this.completeButton.disabled = true;
			this.completeButton.classList.remove("generalButton");
			this.completeButton.classList.add("disabledButton");
		}
	}

	_completeEditProfile = async () => {
		const editMessage = {
			event: "updateClientInfo",
			content: {
				waitingRoomInfo: {},
			},
		};
		if (this.isNicknameUpdated) {
			editMessage.content.waitingRoomInfo.nickname = this.nicknameInput.value;
		}
		if (this.isAvatarUpdated) {
			let avatarImage;
			if (this.isDefaultAvatar) {
				avatarImage = { imageUrl: this.avatarImg.src };
			} else {
				avatarImage = { imageData: this.avatarImg.src };
			}
			editMessage.content.waitingRoomInfo.avatarImage = avatarImage;
		}

		this.clientInfo.socket.send(JSON.stringify(editMessage));
		await new Promise(resolve => {
			const listener = messsageEvent => {
				const { event, content } = JSON.parse(messsageEvent.data);
				if (event === "updateClientInfoResponse" && content.message === "OK") {
					resolve();
				}
				// TODO : 실패 시 처리하기
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		// TODO : 이후 마이페이지 렌더링하기
		this._exitEditProfilePage();
	};

	_initAvatarSelectionModal() {
		this.avatarSelectionModal = document.querySelector(".avatarSelectionModal");
		const avatarEditButton = document.querySelector("#avatarEditButton");
		avatarEditButton.addEventListener("click", this._renderAvatarEditModal.bind(this));
		this._setUploadAvatarFrame();
	}
	_renderAvatarEditModal() {
		this.avatarSelectionModal.style.display = "flex";
		const modalClicked = e => {
			if (e.target.className.includes("selectionAvatarImage")) {
				this.avatarImg.src = e.target.src;
				this.isAvatarUpdated = e.target.dataset.src !== this.clientInfo.avatarUrl;
				this.isDefaultAvatar = true;
				this._hideAvatarEditModal.call(this);
			}
			if (e.target.className.includes("avatarSelectionModal")) {
				this._hideAvatarEditModal.call(this);
			}
			this.avatarSelectionModal.removeEventListener("click", modalClicked);
		};
		this.avatarSelectionModal.addEventListener("click", modalClicked);
	}
	_setUploadAvatarFrame() {
		const uploadFrame = document.querySelector("#uploadFrame");
		const fileInput = document.querySelector("#fileInput");
		uploadFrame.addEventListener("click", () => {
			fileInput.click();
		});
		fileInput.addEventListener("change", event => {
			const file = event.target.files[0];
			if (file) {
				//파일을 화면에 렌더링한다.
				const reader = new FileReader();
				reader.onload = e => {
					this.avatarImg.src = e.target.result;
					this.isAvatarUpdated = true;
					this.isDefaultAvatar = false;
					this._hideAvatarEditModal.call(this);
				};
				reader.readAsDataURL(file);
			}
		});
	}
	_hideAvatarEditModal() {
		this._updateCompleteButton(this.isNicknameUpdated, this.isAvatarUpdated);
		this.avatarSelectionModal.style.display = "none";
	}

	_initExitModal() {
		this.exitModal = document.querySelector(".questionModal");
		this.exitYesButton = document.querySelector(".questionModal button:nth-of-type(1)");
		this.exitNoButton = document.querySelector(".questionModal button:nth-of-type(2)");

		document.querySelector(".exitButton").addEventListener("click", () => {
			this._renderExitModal();
			this.exitYesButton.addEventListener("click", this._exitEditProfilePage);
			this.exitNoButton.addEventListener("click", this._hideExitModal);
		});
	}
	_renderExitModal = () => {
		this.exitModal.style.display = "flex";
	};
	_exitEditProfilePage = () => {
		this.clientInfo.profileTarget = { id: this.clientInfo.id };
		history.back();
	};
	_hideExitModal = () => {
		this.exitModal.style.display = "none";
		this.exitYesButton.removeEventListener("click", this._exitEditProfilePage);
		this.exitNoButton.removeEventListener("click", this._hideExitModal);
	};

	_getHTML() {
		return `
			<button class="exitButton"></button>
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
			${this._getAvatarSectionModalHTML()}
			${this._getExitModalHTML()}
		`;
	}
	_getAvatarSectionModalHTML() {
		if (!this._defaultAvatarPathList) this._defaultAvatarPathList = [];
		const avatarPathListHtml = this._defaultAvatarPathList.reduce(
			(acc, path) =>
				acc +
				`<div class="selectionAvatarFrame">
					<img class="selectionAvatarImage" src="${path}" data-src="${path}">
				</div>`,
			"",
		);
		return `
		  <div class="avatarSelectionModal">
			${avatarPathListHtml}
			<div class="selectionAvatarFrame" id="uploadFrame">
				<img class="uploadIconImage" src="images/uploadIcon.png">
				<input type="file" id="fileInput" style="display: none;" accept="image/*">
			</div>
		  </div>
		  `;
	}
	_getExitModalHTML() {
		return `
			<div class="questionModal">
				<div class="questionBox">
					<div class="question">프로필 편집을 종료하시겠습니다?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}
}

export default EditProfilePageManager;
