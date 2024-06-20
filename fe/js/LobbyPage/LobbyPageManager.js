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
      id: null,
      nickname: null,
      lobbySocket: null,
      gameInfo: {
        pingpongRoomSocket: null,
        roomId: null,
        title: null,
        teamLeftList: null,
        teamRightList: null,
      },
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
    const waitingRoomInfoList = await this._getWaitingRoomList();
    this._renderWaitingRoom(waitingRoomInfoList);

    this._autoSetScollTrackColor();
    this._adjustButtonSize();
  }

  async _getWaitingRoomList() {
    const getWaitingRoomListMessage = {
      event: "getWaitingRoomList",
      content: {},
    };
    this.clientInfo.lobbySocket.send(JSON.stringify(getWaitingRoomListMessage));
    const waitingRoomList = await new Promise((resolve) => {
      const listener = (messageEvent) => {
        const { event, content } = JSON.parse(messageEvent.data);
        if (event === "getWaitingRoomResponse") {
          this.clientInfo.lobbySocket.removeEventListener("message", listener);
          resolve(content.waitingRoomInfoList);
        }
      };
      this.clientInfo.lobbySocket.addEventListener("message", listener);
    });
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
      waitingRoomListContainer.appendChild(
        this._getWaitingRoomElement(
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

  _getWaitingRoomElement(
    roomId,
    team1,
    team2,
    title,
    currendPlayerCount,
    totalPlayerCount
  ) {
    const waitingRoomContainer = document.createElement("div");
    waitingRoomContainer.className = "waitingRoomContainer";

    const gameTypeContainer = document.createElement("div");
    gameTypeContainer.className = "gameTypeContainer";

    const teamName1 = document.createElement("span");
    teamName1.className = "teamName";
    if (team1 === "human") teamName1.textContent = "인간";
    else if (team1 === "vampire") teamName1.textContent = "뱀파이어";

    const vsName = document.createElement("span");
    vsName.className = "vsName";
    vsName.textContent = "vs";

    const teamName2 = document.createElement("span");
    teamName2.className = "teamName";

    if (team2 === "human") teamName2.textContent = "인간";
    else if (team2 === "vampire") teamName2.textContent = "뱀파이어";

    gameTypeContainer.appendChild(teamName1);
    gameTypeContainer.appendChild(vsName);
    gameTypeContainer.appendChild(teamName2);

    const matchName = document.createElement("div");
    matchName.className = "matchName";

    const gameName = document.createElement("div");
    gameName.className = "gameName";
    gameName.textContent = title;

    const matchPlayerCount = document.createElement("div");
    matchPlayerCount.className = "matchPlayerCount";
    matchPlayerCount.textContent = `${currendPlayerCount} / ${totalPlayerCount}`;

    waitingRoomContainer.appendChild(gameTypeContainer);
    waitingRoomContainer.appendChild(matchName);
    waitingRoomContainer.appendChild(gameName);
    waitingRoomContainer.appendChild(matchPlayerCount);

    waitingRoomContainer.addEventListener("click", async () => {
      this.enterModalTitle.innerText = `"${title}"`;
      this.enterRoomModal.style.display = "flex";
      const enterRoomListenerRef = this._enterWaitingRoom.bind(
        this,
        roomId,
        title
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

  async _enterWaitingRoom(roomId, title) {
    const pingpongRoomSocket = new WebSocket(
      `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpong-room/${roomId}/`
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
    pingpongRoomSocket.send(JSON.stringify(enterWaitingRoomMessage));

    const { teamLeftList, teamRightList } = await new Promise((resolve) => {
      pingpongRoomSocket.addEventListener(
        "message",
        function listener(messageEvent) {
          const { event, content } = JSON.parse(messageEvent.data);
          if (event === "enterWaitingRoomResponse") {
            pingpongRoomSocket.removeEventListener("message", listener);
            resolve(content);
          }
        }.bind(this)
      );
    });

    const gameInfo = {
      pingpongRoomSocket,
      roomId,
      title,
      teamLeftList,
      teamRightList,
    };
    this._unsubscribeWindow();
    this.clientInfo.lobbySocket.close();
    this.clientInfo.lobbySocket = null;
    this.clientInfo.gameInfo = gameInfo;
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
