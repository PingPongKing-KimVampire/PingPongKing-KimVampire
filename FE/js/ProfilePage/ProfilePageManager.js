import { GlobalConnectionError, ProfileTargetNotFound, isSocketConnected } from "../Error/Error.js";
import { getMatchLogDiv, setMatchLogPlayerClickListener } from "./MatchLog.js";

class ProfilePageManager {
	constructor(app, clientInfo, renderPage, queryParam) {
		console.log("ProfilePage!!!");
		this.clientInfo = clientInfo;
		this.app = app;
		this.renderPage = renderPage;
		this.queryParam = queryParam;
	}

	async connectPage() {
		if (!isSocketConnected(this.clientInfo?.socket)) throw new GlobalConnectionError();
		if (!this.queryParam | (this.queryParam["id"] === undefined)) throw new ProfileTargetNotFound();

		this.profileTarget = { id: parseInt(this.queryParam["id"]) };
		this.clientInfo.profileTarget = null;
		const { nickname, avatarUrl, gameHistoryList } = await this.getClientProfile(this.profileTarget.id);
		this.profileTarget.nickname = nickname;
		this.profileTarget.avatarUrl = avatarUrl;
		this.profileTarget.gameHistoryList = gameHistoryList;
		this.profileTarget.winCount = this.profileTarget.gameHistoryList.filter(gameHistory => gameHistory.result === "WIN").length;
		this.profileTarget.loseCount = this.profileTarget.gameHistoryList.filter(gameHistory => gameHistory.result === "LOSE").length;
	}

	clearPage() {}

	initPage() {
		this.app.innerHTML = this._getHTML();
		this._setMatchLogClickListener();
		this._setExitButton();
		this._setEditProfileButton();
		setMatchLogPlayerClickListener(this.renderPage.bind(this));
	}

	_setMatchLogClickListener() {
		document.querySelectorAll(".matchLog").forEach(matchLog => {
			matchLog.addEventListener("click", event => {
				const id = parseInt(matchLog.dataset.id);
				this.clientInfo.statisticsInfo = {
					profileId: this.profileTarget.id,
					gameId: id,
				};
				this.renderPage("statistics", {
					profileId: this.profileTarget.id,
					gameId: id,
				});
			});
		});
	}

	_setEditProfileButton() {
		document.querySelector(".editProfileButton").addEventListener("click", async () => {
			if (this.profileTarget.id === this.clientInfo.id) this.renderPage("editProfile");
			else {
				alert("친구 추가/삭제/요청/요청 취소는 미구현입니다.");
			}
		});
	}

	_setExitButton() {
		document.querySelector(".exitButton").addEventListener("click", async () => {
			history.back();
		});
	}

	async getClientProfile(id) {
		const getCLientProfileMessage = {
			event: "getClientProfile",
			content: { clientId: id },
		};
		this.clientInfo.socket.send(JSON.stringify(getCLientProfileMessage));
		return await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientProfileResponse") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve({ nickname: content.nickname, avatarUrl: content.avatarUrl, gameHistoryList: content.gameHistoryList });
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
	}

	_getHTML() {
		return `
        <button class="exitButton"></button>
        <div id="container">
            <div id="avatarContainer">
                <div class="avatarImgFrame">
                    <img class="avatarImg" src="${this.profileTarget.avatarUrl}">
                </div>
                <div id="WinLossContainer">
                    <div class="nicknameFrame">
                        ${this.profileTarget.nickname}
                    </div>
                    <div class="winLossFrame">
                        ${this.profileTarget.winCount}승 ${this.profileTarget.loseCount}패
                    </div>
                </div>
                <button class="editProfileButton">
                    ${this.clientInfo.id === this.profileTarget.id ? "프로필 편집" : "친구추가"}
                </button>
            </div>
            <div id="matchLogContainer">
                ${this.profileTarget.gameHistoryList.map(gameHistory => `<div class="matchLogPanel">${getMatchLogDiv(gameHistory)}</div>`).join("")}
            </div>
        </div>
        `;
	}
}

export default ProfilePageManager;
