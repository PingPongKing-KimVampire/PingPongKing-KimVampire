import windowObservable from "../../WindowObservable.js";

import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class WaitingRoomPageManager {
  constructor(app, clientInfo, _onStartPingpongGame, _onExitWaitingRoom) {
    this.app = app;
    this._onStartPingpongGame = _onStartPingpongGame;
    this._onExitWaitingRoom = _onExitWaitingRoom;
    console.log("Waiting Room Page!");
    this.clientInfo = {
      socket: null,
      id: null,
      nickname: null,
      lobbySocket: null,
      gameInfo: {
        pingpongRoomSocket: null,
        roomId: null,
        title: null,
        teamLeftList: null,
        teamRightList: null,
        teamLeftMode: null,
        teamRightMode: null,
        teamLeftTotalPlayerCount: null,
        teamRightTotalPlayerCount: null,
      },
    };

    // const playerInfo = {
    // 	clientId: null,
    // 	clientNickname: null,
    // 	readyState: null
    // }
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
    document
      .querySelector(".exitButton")
      .addEventListener("click", this._exitWaitingRoom.bind(this));
  }

  async _exitWaitingRoom() {
    this.clientInfo.gameInfo.pingpongRoomSocket.close();
    this.clientInfo.gameInfo = null;
    this.clientInfo.lobbySocket = await this._connectLobbySocket(
      this.clientInfo.id
    );
    this._onExitWaitingRoom();
  }

  //login 페이지와 중복되는 로직임. 어떻게 공유할 것인지 생각해야함.
  //loginPage의 static 메서드로 만드는것은 어떨까?
  //this바인딩해서 주면 괜찮을듯
  async _connectLobbySocket(id) {
    const lobbySocket = new WebSocket(
      `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
    );
    await new Promise((resolve) => {
      lobbySocket.addEventListener("open", () => {
        resolve();
      });
    });
    const enterLobbyMessage = {
      event: "enterLobby",
      content: {
        clientId: id,
      },
    };
    lobbySocket.send(JSON.stringify(enterLobbyMessage));

    await new Promise((resolve) => {
      lobbySocket.addEventListener(
        "message",
        function listener(messageEvent) {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "enterLobbyResponse" && content.message === "OK") {
            lobbySocket.removeEventListener("message", listener);
            resolve();
          }
        }.bind(this)
      );
    });

    return lobbySocket;
  }

  _listenWaitingRoomEvent() {
    const listener = (messageEvent) => {
      const message = JSON.parse(messageEvent.data);
      const { event, content } = message;
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
