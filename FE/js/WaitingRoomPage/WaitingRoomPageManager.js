import windowObservable from "../../WindowObservable.js";

class WaitingRoomPageManager {
  constructor(app, clientInfo, _onStartPingpongGame) {
    this.app = app;
    this._onStartPingpongGame = _onStartPingpongGame;
    console.log("Waiting Room Page!");
    this.clientInfo = clientInfo;

    this._initPage();
    this._listenWaitingRoomEvent();
  }

  _initPage() {
    this.app.innerHTML = this._getHTML();

    this.leftReadyText = document.querySelector(
      ".teamPanel:first-of-type .readyText"
    );
    this.rightReadyText = document.querySelector(
      ".teamPanel:last-of-type .readyText"
    );

    const orientation = windowObservable.getOrientation();
    this._toggleReadyTextVisible(orientation);
    this._subscribeWindow();
    document
      .querySelector("#readyButton")
      .addEventListener(
        "click",
        this._sendMyReadyStateChangeMessage.bind(this)
      );
  }

  _listenWaitingRoomEvent() {
    const listener = (messageEvent) => {
      const message = JSON.parse(messageEvent.data);
      const { event, content } = message;
      //   console.log(message);
      if (event === "notifyWaitingRoomEnter") {
        const { clientId, clientNickname, team } = content;
        this._pushNewPlayer(clientId, clientNickname, team);
        this._initPage();
      } else if (event === "notifyWaitingRoomExit") {
        const clientId = content.clientId;
        this._popPlayer(clientId);
        this._initPage();
      } else if (event === "notifyReadyStateChange") {
        const { clientId, state } = content;
        this._updateReadyState(clientId, state);
        this._initPage();
      } else if (event === "notifyGameReady") {
        //3, 2, 1 추후 구현
      } else if (event === "notifyGameStart") {
        this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener(
          "message",
          listener
        );
        this._onStartPingpongGame();
      }
    };
    this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener(
      "message",
      listener
    );
  }

  _pushNewPlayer(clientId, clientNickname, team) {
    if (this.clientInfo.id === clientId) return;
    if (team === "left")
      this.clientInfo.gameInfo.teamLeftList.push({
        clientId,
        clientNickname,
        readyState: "NOTREADY",
      });
    if (team === "right")
      this.clientInfo.gameInfo.teamRightList.push({
        clientId,
        clientNickname,
        readyState: "NOTREADY",
      });
  }

  _popPlayer(clientId) {
    this.clientInfo.gameInfo.teamLeftList =
      this.clientInfo.gameInfo.teamLeftList.filter((player) => {
        player.clientId !== clientId;
      });
    this.clientInfo.gameInfo.teamRightList =
      this.clientInfo.gameInfo.teamRightList.filter((player) => {
        player.clientId !== clientId;
      });
  }

  _updateReadyState(clientId, readyState) {
    this.clientInfo.gameInfo.teamLeftList.forEach((player) => {
      if (player.clientId === clientId) player.readyState = readyState;
    });
    this.clientInfo.gameInfo.teamRightList.forEach((player) => {
      if (player.clientId === clientId) player.readyState = readyState;
    });
  }

  _sendMyReadyStateChangeMessage() {
    let myPlayer = this.clientInfo.gameInfo.teamLeftList.find(
      (player) => player.clientId === this.clientInfo.id
    );
    if (!myPlayer)
      myPlayer = this.clientInfo.gameInfo.teamRightList.find(
        (player) => player.clientId === this.clientInfo.id
      );

    const changedReadyState =
      myPlayer.readyState === "READY" ? "NOTREADY" : "READY";
    const readyMessage = {
      event: "changeReadyState",
      content: {
        state: changedReadyState,
      },
    };
    this.clientInfo.gameInfo.pingpongRoomSocket.send(
      JSON.stringify(readyMessage)
    );
  }

  _changeMyReadyState(clientId) {
    let targetPlayer = this.clientInfo.gameInfo.teamLeftList.find(
      (player) => player.clientId === clientId
    );
    if (!targetPlayer)
      targetPlayer = this.clientInfo.gameInfo.teamRightList.find(
        (player) => player.clientId === clientId
      );
    targetPlayer.readyState === "READY"
      ? (targetPlayer.readyState = "NOTREADY")
      : (targetPlayer.readyState = "READY");
  }

  _subscribeWindow() {
    this.toggleReadyTextVisibleRef = this._toggleReadyTextVisible.bind(this);
    windowObservable.subscribeOrientationChange(this.toggleReadyTextVisibleRef);
  }

  _toggleReadyTextVisible(orientation) {
    if (orientation === "landscape") {
      this.leftReadyText.classList.remove("invisible");
      this.rightReadyText.classList.remove("invisible");
    } else if (orientation === "portrait") {
      this.leftReadyText.classList.add("invisible");
      this.rightReadyText.classList.add("invisible");
    }
  }

  _getHTML() {
    return `
			<button class="exitButton"></button>
			<div id="container">
				<div id="header">
					<div id="title">${this.clientInfo.gameInfo.title}</div>
					<div id="mode">${this._getMode()}</div>
				</div>
				<div id="panel">
					${this._getTeamPanelHTML(
            this.clientInfo.gameInfo.teamLeftMode,
            this.clientInfo.gameInfo.teamLeftList,
            this.clientInfo.gameInfo.teamLeftTotalPlayerCount
          )}
					<div id="vsText">VS</div>
					${this._getTeamPanelHTML(
            this.clientInfo.gameInfo.teamRightMode,
            this.clientInfo.gameInfo.teamRightList,
            this.clientInfo.gameInfo.teamRightTotalPlayerCount
          )}
				</div>
				<button class="generalButton" id="readyButton">Ready</button>
			</div>
		`;
  }
  _getMode() {
    const left =
      this.clientInfo.gameInfo.teamLeftMode === "vampire" ? "뱀파이어" : "인간";
    const right =
      this.clientInfo.gameInfo.teamRightMode === "vampire"
        ? "뱀파이어"
        : "인간";
    return `${left} VS ${right} 모드`;
  }

  _getTeamPanelHTML(mode, teamList, totalPlayerCount) {
    let infoHTML;
    if (totalPlayerCount === 1) {
      if (teamList.length === 0) infoHTML = this._getPlayerEmptyInfoHTML(mode);
      else infoHTML = this._getPlayerInfoHTML(mode, teamList[0]);
    } else {
      infoHTML = this._getPlayerInfoListHTML(teamList, totalPlayerCount);
    }
    const readyAll = teamList.every((player) => player.readyState === "READY");
    return `
			<div class="teamPanel">
				<div class="status">
					<img class="teamIcon ${mode}Icon" src="images/${mode}Icon.png">
					<div class="readyText">
						Ready!
						<div class="readyStroke ${readyAll ? "on" : ""}">Ready!</div>
					</div>
				</div>
				<div class="info">${infoHTML}</div>
			</div>
		`;
  }

  _getPlayerEmptyInfoHTML(mode) {
    const abilityBtnHTML =
      '<button class="abilityButton generalButton">능력<br>선택</button>';
    return `
			<div class="name">?</div>
			<div class="avatar">
				${mode === "vampire" ? abilityBtnHTML : ""}
				<div class="avatarImgFrame emptyFrame">
					<div class="avatarQuestionMark">?</div>
				</div>
			</div>
		`;
  }

  _getPlayerInfoHTML(mode, player) {
    const abilityBtnHTML =
      '<button class="abilityButton generalButton">능력<br>선택</button>';
    return `
			<div class="name">${player.clientNickname}</div>
			<div class="avatar">
				${mode === "vampire" ? abilityBtnHTML : ""}
				<div class="avatarImgFrame">
					<img class="avatarImg ${
            player.readyState === "READY" ? "on" : ""
          }" src="images/playerA.png">
				</div>
			</div>
		`;
  }

  _getPlayerInfoListHTML(playerList, totalPlayerCount) {
    let listHTML = "";
    playerList.forEach((player) => {
      // TODO : 아직 들어오지 않은 자리 구현 (?)
      listHTML += `
				<div class="listItem ${player.clientId === this.clientInfo.id ? "me" : ""}">
					${this._getPlayerInfoItemHTML(player)}
				</div>`;
    });
    for (let i = 0; i < totalPlayerCount - playerList.length; i++) {
      // TODO : 물음표 리스트 아이템 띄우기
      listHTML += `<div class="listItem">${this._getEmptyItemHTML()}</div>`;
    }
    for (let i = 0; i < 5 - this.clientInfo.gameInfo.totalPlayerCount; i++) {
      listHTML += `<div class="listItem">${this._getXItemHTML()}</div>`;
    }
    return listHTML;
  }
  _getPlayerInfoItemHTML(player) {
    return `
			<div class="avatarImgFrame">
				<img class="avatarImg ${
          player.readyState === "READY" ? "on" : ""
        }" src="images/playerA.png">
			</div>
			<div class="listName">${player.clientNickname}</div>
		`;
  }
  _getEmptyItemHTML() {
    return `
			<div class="avatarImgFrame emptyFrame">
				<div class="avatarQuestionMark">?</div>
			</div>
			<div class="listName">?</div>
		`;
  }
  _getXItemHTML() {
    return `
			<div class="avatarImgFrame">
				<div class="diagonal-1"></div>
				<div class="diagonal-2"></div>
			</div>
		`;
  }
}

export default WaitingRoomPageManager;
