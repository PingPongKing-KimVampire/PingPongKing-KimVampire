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
      roomId: null,
      isReferee: false,
    };
    this.clientInfo = clientInfo;
    this.onClickWatingRoomCreationButton = onClickWatingRoomCreationButton;
    this.onCLickWaitingRoomButton = onCLickWaitingRoomButton;

    this._setCreateWaitingRoomButton();
    window.addEventListener("resize", this._adjustButtonSize);
    window.addEventListener("resize", this._autoSetScollTrackColor);
  }

  async initPage() {
    const waitingRoomList = await this._getWaitingRoomList();
    this._renderWaitingRoom(waitingRoomList);

    this._autoSetScollTrackColor();
    this._adjustButtonSize();
  }

  _setCreateWaitingRoomButton() {
    const createWaitingRoomButton = document.querySelector(
      ".createWaitingRoomButton"
    );
    createWaitingRoomButton.addEventListener("click", () => {
      this.onClickWatingRoomCreationButton();
    });
  }

  _renderWaitingRoom(waitingRoomList) {
    waitingRoomList.forEach((waitingRoom) => {
      const { currentPlayerCount, mode, totalPlayerCount, roomId } =
        waitingRoom;
      const waitingRoomListContainer = document.querySelector(
        ".waitingRoomListContainer"
      );
      //방 아이디 추가하기
      waitingRoomListContainer.appendChild(
        this._getWaitingRoomelement(
          roomId,
          "임시모드",
          mode,
          "대기실 제목 추가해야함",
          currentPlayerCount,
          totalPlayerCount
        )
      );
    });
  }

  async _getWaitingRoomList() {
    const getWaitingRoomLisMessage = {
      sender: "client",
      receiver: ["server"],
      event: "getWaitingRoomList",
      content: {},
    };
    this.clientInfo.socket.send(JSON.stringify(getWaitingRoomLisMessage));
    const waitingRoomList = await this._getWaitingRoomListMsg();
    return waitingRoomList;
  }

  _getWaitingRoomListMsg() {
    return new Promise((resolve, reject) => {
      const listener = (messageEvent) => {
        const message = JSON.parse(messageEvent.data);
        const { sender, receiver, event, content } = message;
        if (event === "getWaitingRoomResponse") {
          this.clientInfo.socket.removeEventListener("message", listener);
          resolve(content.gameInfoList);
        }
      };
      this.clientInfo.socket.addEventListener("message", listener);
    });
  }

  _getHTML() {
    return `
    <div class="lobby">
    <div class="lobbyInner">
        ${this._getWaitingRoomCreationButtonHtml()}
        ${this._getWaitingRoomListContainerHtml()}
    </div>
  </div>
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
      this._enterWaitingRoom(roomId);
      await new Promise((resolve, reject) => {
        const listener = (messageEvent) => {
          const message = JSON.parse(messageEvent.data);
          const { sender, receiver, event, content } = message;
          if (event === "enterWaitingRoomResponse") {
            this.clientInfo.socket.removeEventListener("message", listener);
            resolve();
          }
        };
        this.clientInfo.socket.addEventListener("message", listener);
      });

      //하드코딩되어있음
      const gameInfo = {
        mode: "normal",
        totalPlayerCount,
      };
      this.onCLickWaitingRoomButton(roomId, gameInfo);
    });
    return waitingRoomContainer;
  }

  _enterWaitingRoom(roomId) {
    const enterMessage = {
      sender: "client",
      receiver: ["waitingRoom"],
      event: "enterWaitingRoom",
      content: {
        roomId,
        clientId: this.clientInfo.id,
        clientNickname: this.clientInfo.nickname,
      },
    };
    this.clientInfo.socket.send(JSON.stringify(enterMessage));
  }
}

export default LobbyPageManager;
