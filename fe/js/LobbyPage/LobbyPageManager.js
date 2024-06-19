import windowObservable from "../../WindowObservable.js";

import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class LobbyPageManager {
  constructor(
    app,
    clientInfo,
    onClickWatingRoomCreationButton,
    onCLickWaitingRoomButton
  ) {
    console.log("Lobby Page!");
    app.innerHTML = this._getHTML();

    this.clientInfo = {
      socket: null,
      lobbySocket: null,
      id: null,
      nickname: null,
      roomId: null,
      isReferee: false,
    };
    this.clientInfo = clientInfo;
    this.onClickWatingRoomCreationButton = onClickWatingRoomCreationButton;
    this.onCLickWaitingRoomButton = onCLickWaitingRoomButton;
    this._setCreateWaitingRoomButton();

    this.enterRoomModal = document.querySelector(".questionModal");
    this.enterYesButton = document.querySelector(
      ".questionModal .activatedButton:nth-of-type(1)"
    );
    this.enterNoButton = document.querySelector(
      ".questionModal .activatedButton:nth-of-type(2)"
    );
    this.enterModalTitle = document.querySelector(".questionModal .title");
  }

  async initPage() {
    this.lobbySocket = new WebSocket(
      `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
    );
    this.clientInfo.lobbySocket = this.lobbySocket;

    await new Promise((resolve) => {
      this.lobbySocket.addEventListener("open", () => {
        resolve();
      });
    });

    const enterLobbyMessage = {
      event: "enterLobby",
      content: {
        clientId: this.clientInfo.id,
      },
    };
    this.lobbySocket.send(JSON.stringify(enterLobbyMessage));

    await new Promise((resolve) => {
      this.lobbySocket.addEventListener(
        "message",
        function listener(messageEvent) {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "enterLobbyResponse" && content.message === "OK") {
            this.lobbySocket.removeEventListener("message", listener);
            resolve();
          }
        }.bind(this)
      );
    });

    const waitingRoomList = await this._getWaitingRoomList();
    this._renderWaitingRoom(waitingRoomList);

    this._autoSetScollTrackColor();
    this._adjustButtonSize();
  }

  async _getWaitingRoomList() {
    const getWaitingRoomLisMessage = {
      event: "getWaitingRoomList",
      content: {},
    };
    this.lobbySocket.send(JSON.stringify(getWaitingRoomLisMessage));
    const waitingRoomList = await new Promise(
      function listener(resolve) {
        this.clientInfo.socket.addEventListener("message", (messageEvent) => {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "getWaitingRoomResponse") {
            this.lobbySocket.removeEventListener("message", listener);
            resolve(content.gameInfoList);
          }
        });
      }.bind(this)
    );
    return waitingRoomList;
  }

  _subscribeWindow() {
    this._adjustButtonSizeRef = this._adjustButtonSize.bind(this);
    windowObservable.subscribeResize(_adjustButtonSizeRef);
    this._autoSetScollTrackColorRef = this._autoSetScollTrackColor.bind(this);
    windowObservable.subscribeResize(_autoSetScollTrackColorRef);
  }

  _unsubscribeWindow() {
    windowObservable.unsubscribeResize(this._adjustButtonSizeRef);
    windowObservable.unsubscribeResize(this._autoSetScollTrackColorRef);
  }

  _setCreateWaitingRoomButton() {
    const createWaitingRoomButton = document.querySelector(
      ".createWaitingRoomButton"
    );
    createWaitingRoomButton.addEventListener("click", () => {
      this._unsubscribeWindow();
      this.onClickWatingRoomCreationButton();
    });
  }

  _renderWaitingRoom(waitingRoomList) {
    waitingRoomList.forEach((waitingRoom) => {
      const {
        roomId,
        title,
        leftMode,
        rightMode,
        currentPlayerCount,
        maxPlayerCount,
      } = waitingRoom;
      const waitingRoomListContainer = document.querySelector(
        ".waitingRoomListContainer"
      );
      //방 아이디 추가하기
      waitingRoomListContainer.appendChild(
        this._getWaitingRoomelement(
          roomId,
          leftMode,
          rightMode,
          title,
          currentPlayerCount,
          maxPlayerCount
        )
      );
    });
  }

  _adjustButtonSize() {
    const button = document.querySelector(".createWaitingRoomButton");
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    if (viewWidth < viewHeight) {
      button.style.height = "4vh";
      button.style.width = "calc(4vh * 4 / 1)";
    } else {
      button.style.width = "16vw";
      button.style.height = "calc(16vw * 1 / 4)";
    }
  }

  _autoSetScollTrackColor() {
    let waitingRoomListContainer = document.querySelector(
      ".waitingRoomListContainer"
    );
    if (
      waitingRoomListContainer.scrollHeight >
      waitingRoomListContainer.clientHeight
    ) {
      waitingRoomListContainer.classList.remove("scrollbar-scrolltrack");
      waitingRoomListContainer.classList.add("transparent-scrolltrack");
    } else {
      waitingRoomListContainer.classList.add("scrollbar-scrolltrack");
      waitingRoomListContainer.classList.remove("transparent-scrolltrack");
    }
  }

  _getWaitingRoomelement(
    roomId,
    team1,
    team2,
    gameTitle,
    currendPlayerCount,
    totalPlayerCount
  ) {
    const waitingRoomContainer = document.createElement("div");
    waitingRoomContainer.className = "waitingRoomContainer";

    const gameTypeContainer = document.createElement("div");
    gameTypeContainer.className = "gameTypeContainer";

    const teamName1 = document.createElement("span");
    teamName1.className = "teamName";
    teamName1.textContent = team1;

    const vsName = document.createElement("span");
    vsName.className = "vsName";
    vsName.textContent = "vs";

    const teamName2 = document.createElement("span");
    teamName2.className = "teamName";
    teamName2.textContent = team2;

    gameTypeContainer.appendChild(teamName1);
    gameTypeContainer.appendChild(vsName);
    gameTypeContainer.appendChild(teamName2);

    const matchName = document.createElement("div");
    matchName.className = "matchName";

    const gameName = document.createElement("div");
    gameName.className = "gameName";
    gameName.textContent = gameTitle;

    const matchPlayerCount = document.createElement("div");
    matchPlayerCount.className = "matchPlayerCount";
    matchPlayerCount.textContent = `${currendPlayerCount} / ${totalPlayerCount}`;

    waitingRoomContainer.appendChild(gameTypeContainer);
    waitingRoomContainer.appendChild(matchName);
    waitingRoomContainer.appendChild(gameName);
    waitingRoomContainer.appendChild(matchPlayerCount);

    waitingRoomContainer.addEventListener("click", async () => {
      this.enterModalTitle.innerText = `"${gameTitle}"`;
      this.enterRoomModal.style.display = "flex";
      const enterRoomListenerRef = this._enterWaitingRoom.bind(
        this,
        roomId,
        gameTitle
      );
      const hideModalLisenerRef = () => {
        this.enterRoomModal.style.display = "none";
        this.enterYesButton.removeEventListener("click", enterRoomListenerRef);
        this.enterNoButton.removeEventListener("click", hideModalLisenerRef);
      };

      this.enterYesButton.addEventListener("click", enterRoomListenerRef);
      this.enterNoButton.addEventListener("click", hideModalLisenerRef);
    });
    return waitingRoomContainer;
  }

  async _enterWaitingRoom(roomId, gameTitle) {
    const pingpongRoomSocket = new WebSocket(
      `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpongRoom/${roomId}`
    );

    await new Promise((resolve) => {
      pingpongRoomSocket.addEventListener("open", () => {
        resolve();
      });
    });

    const enterWaitingRoomMessage = {
      event: "enterWaitingRoom",
      content: {
        clientId: this.clientInfo.id,
      },
    };
    this.pingpongRoomSocket.send(JSON.stringify(enterWaitingRoomMessage));

    const { teamLeftList, teamRightList } = await new Promise((resolve) => {
      pingpongRoomSocket.addEventListener(
        "message",
        function listener(messageEvent) {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "enterWaitingRoomResponse") {
            this.pingpongRoomSocket.removeEventListener("message", listener);
            resolve(content);
          }
        }.bind(this)
      );
    });

    const gameInfo = {
      pingpongRoomSocket,
      roomId,
      title: gameTitle,
      teamLeftList,
      teamRightList,
    };
    this._unsubscribeWindow();
    this.lobbySocket.close();

    //페이지 이동
    this.onCLickWaitingRoomButton(gameInfo);
  }

  _getHTML() {
    return `
    <div class="lobby">
      <div class="lobbyInner">
          ${this._getWaitingRoomCreationButtonHtml()}
          ${this._getWaitingRoomListContainerHtml()}
      </div>
    </div>
    ${this._getEnterWaitingRoomModalHTML()};
  `;
  }

  _getWaitingRoomCreationButtonHtml() {
    return `<button class="createWaitingRoomButton">탁구장 생성하기</button>`;
  }

  _getWaitingRoomListContainerHtml() {
    return `<div class="outerContainer">
    <div class="waitingRoomListContainer">

    </div>
  </div>
  `;
  }

  _getEnterWaitingRoomModalHTML() {
    return `
			<div class="questionModal">
				<div class="questionBox">
          <div class="title"></div>
					<div class="question">입장 하시겠습니까?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
  }
}

export default LobbyPageManager;
