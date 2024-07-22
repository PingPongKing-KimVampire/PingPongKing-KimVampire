class ProfilePageManager {
	constructor(app, clientInfo, renderLobbyPage) {
		console.log("ProfilePage!!!");
		this.clientInfo = clientInfo;
		this.app = app;
		this.renderLobbyPage = renderLobbyPage;

		this.clientInfo = {
			id: 1,
			nickname: "김뱀파이어",
			avatarUrl: "images/playerA.png",
		};

		//하드코딩
		this.clientInfo.profileTarget = { id: 3 };

		this.profileTarget = { id: this.clientInfo.profileTarget.id };
		this.clientInfo.profileTarget = null;
		this._initPage();
	}

	async _initPage() {
		// const { nickname, avatarUrl, gameHistoryList } = await this.getClientProfile(this.profileTarget.id);
		const { nickname, avatarUrl, gameHistoryList } = {
			nickname: "김뱀파이어2다",
			avatarUrl: "images/playerA.png",
			gameHistoryList: [
				{
					gameId: 1234,
					timestamp: "2024-07-02T14:30:00.123456Z",
					score: [1, 100],
					result: "LOSE",
					mode: "HUMAN_VAMPIRE",
					teamKind: ["HUMAN", "VAMPIRE"],
					ability: ["jiantBlocker", "jiantBlocker"],
					myTeamClientInfoList: [
						{
							id: 3,
							nickname: "영우",
							avatarUrl: "images/playerA.png",
						},
						{
							id: 3,
							nickname: "영우",
							avatarUrl: "images/playerA.png",
						},
						{
							id: 3,
							nickname: "영우",
							avatarUrl: "images/playerA.png",
						},
					],
					opponnetTeamClientInfoList: [
						{
							id: 3,
							nickname: "영우",
							avatarUrl: "images/playerA.png",
						},
					],
				},
			],
		};
		this.profileTarget.nickname = nickname;
		this.profileTarget.avatarUrl = avatarUrl;
		this.profileTarget.gameHistoryList = gameHistoryList;
		this.profileTarget.winCount = this.profileTarget.gameHistoryList.filter(gameHistory => gameHistory.result === "WIN").length;
		this.profileTarget.loseCount = this.profileTarget.gameHistoryList.filter(gameHistory => gameHistory.result === "LOSE").length;
		this.app.innerHTML = this._getHTML();
	}

	async getClientProfile(id) {
		const getCLientProfileMessage = {
			event: "getCLientProfile",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(getCLientProfileMessage));
		return await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientProfiileResponse") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve({ nickname: content.nickname, imageUrl: content.imageUrl, gameHistroryList: content.gameHistroryList });
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
                ${this.profileTarget.gameHistoryList.map(gameHistory => this._getMatchLogDiv(gameHistory)).join("")}
            </div>
        </div>
        `;
	}

	_getMatchLogDiv(gameHistory) {
		const date = new Date(gameHistory.timestamp);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `
        <div class="matchLog data-id="${gameHistory.gameId}"">
            <div class="matchDate">
                ${year}.${month}.${day}
            </div>
            <div class="matchScoreContainer">
                <img class="matchResultImage" src="images/${gameHistory.result.toLowerCase()}Icon.svg">
                <div class="scoreFrame">
                    ${gameHistory.score[0]} : ${gameHistory.score[1]}
                </div>
            </div>
            <div class="matchTeamListContainer">
                <div class="matchTeamContainer">
                    ${gameHistory.ability[0] !== "none" ? "<img class='vampireAbilityImage' src='images/ability/" + gameHistory.ability[0] + ".png'>" : "<div></div>"}
                    <img class="match${gameHistory.teamKind[0] === "HUMAN" ? "Human" : "Vampire"}TeamImage" src="images/${gameHistory.teamKind[0].toLowerCase()}Icon.png">
                </div>
                <div class="vsFrame">VS</div>
                <div class="matchTeamContainer">
                    <img class="match${gameHistory.teamKind[1] === "HUMAN" ? "Human" : "Vampire"}TeamImage" src="images/${gameHistory.teamKind[1].toLowerCase()}Icon.png">
                    ${gameHistory.ability[1] !== "none" ? "<img class='vampireAbilityImage' src='images/ability/" + gameHistory.ability[1] + ".png'>" : "<div></div>"}
                </div>
            </div>
            ${this.getMatchPlayerListContainerDiv(gameHistory.myTeamClientInfoList, gameHistory.opponnetTeamClientInfoList)}
        </div>       
        `;
	}

	getMatchPlayerListContainerDiv(myTeamClientInfoList, opponnetTeamClientInfoList) {
		return `
        <div class="matchPlayerListContainer">
            <div class="teamPlayerListContainer">
                ${myTeamClientInfoList.map(player => this.getPlayerContainerDiv(player, "red")).join("")}
                ${Array.from({ length: 5 - myTeamClientInfoList.length })
									.map(() => this.getEmptyPlayerContainerDiv("red"))
									.join("")}
            </div>
            <div class="teamPlayerListContainer">
                ${opponnetTeamClientInfoList.map(player => this.getPlayerContainerDiv(player, "blue")).join("")}
                ${Array.from({ length: 5 - opponnetTeamClientInfoList.length })
									.map(() => this.getEmptyPlayerContainerDiv("blue"))
									.join("")}
            </div>
        </div>
        `;
	}

	getPlayerContainerDiv(player, color) {
		return `
        <div class="playerContainer" data-id="${player.id}">
            <div class="playerAvatarImgFrame ${color}Border">
                <img class="playerAvatarImg" src="${player.avatarUrl}">
            </div>
            <div class="playerNickname">
                <span>${player.nickname}</span>
            </div>
        </div>
        `;
	}
	getEmptyPlayerContainerDiv(color) {
		return `
        <div class="playerContainer">
             <div class="playerAvatarImgFrame ${color}Border">
                 <div class="noAvatar${color === "red" ? "Red" : "Blue"}"></div>
             </div>
             <div class="playerNickname">
                 <span></span>
             </div>
         </div>`;
	}
}

export default ProfilePageManager;
