import windowObservable from "../../WindowObservable.js";

class Player {
  constructor(clientInfo, playerList, gameInfo) {
    this._initPlayerProperty(clientInfo, playerList, gameInfo);
    this._subscribeWindow();
  }

  _initPlayerProperty(clientInfo, playerList, gameInfo) {
    this.clientInfo = clientInfo;
    this.playerList = playerList;
    this.myTeam = this.playerList.find(
      (player) => player.clientId === clientInfo.id
    ).team;
    this.gameInfo = {
      boardWidth: null,
      boardHeight: null,
      paddleWidth: null,
      paddleHeight: null,
      ballRadius: null,
    };
    this.gameInfo = gameInfo;
    this.subBoard = document.querySelector(".subPlayBoard:nth-of-type(2)");
    this.subBoardRect = {
      top: null,
      left: null,
      height: null,
      width: null,
    };
    this.orientation = null;
    this.updateSubBoardRect();
    this.orientation = windowObservable.getOrientation();
  }

  _subscribeWindow() {
    windowObservable.subscribeResize(this.updateSubBoardRect.bind(this));
    windowObservable.subscribeOrientationChange(
      this.updateOrientation.bind(this)
    );
    windowObservable.subscribeMousemove(this.sendPaddlePosition.bind(this));
  }

  updateSubBoardRect() {
    this.subBoardRect = this.subBoard.getBoundingClientRect();
  }

  updateOrientation(orientation) {
    this.orientation = orientation;
  }

  sendPaddlePosition(e) {
    let x, y;
    const yPos = e.clientY - this.subBoardRect.top;
    const xPos = e.clientX - this.subBoardRect.left;

    if (this.orientation === "landscape") {
      y = (yPos / this.subBoardRect.height) * this.gameInfo.boardHeight;
      x =
        this.gameInfo.boardWidth / 2 +
        ((xPos / this.subBoardRect.width) * this.gameInfo.boardWidth) / 2;
    } else if (this.orientation === "portrait") {
      y =
        this.gameInfo.boardHeight -
        (xPos / this.subBoardRect.width) * this.gameInfo.boardHeight;
      x =
        this.gameInfo.boardWidth / 2 +
        ((yPos / this.subBoardRect.height) * this.gameInfo.boardWidth) / 2;
    }

    x = Math.max(
      this.gameInfo.boardWidth / 2 + this.gameInfo.paddleWidth / 2,
      Math.min(x, this.gameInfo.boardWidth - this.gameInfo.paddleWidth / 2)
    );
    y = Math.max(
      0 + this.gameInfo.paddleHeight / 2,
      Math.min(y, this.gameInfo.boardHeight - this.gameInfo.paddleHeight / 2)
    );

    if (this.myTeam === "right") {
      x = x;
      y = y;
    } else if (this.myTeam === "left") {
      x = this.gameInfo.boardWidth - x;
      y = y;
    }

    const msg = {
      sender: "player",
      receiver: ["player", "referee"],
      event: "updatePaddleLocation",
      content: {
        roomId: this.clientInfo.roomId,
        clientId: this.clientInfo.id,
        xPosition: x,
        yPosition: y,
      },
    };
    this.clientInfo.socket.send(JSON.stringify(msg));
  }

  // sendStartGame() {
  //   console.log("게임 시작해줘");
  //   // this.referee.startGame(this.gameObjectRenderer);
  // }
}

export default Player;
