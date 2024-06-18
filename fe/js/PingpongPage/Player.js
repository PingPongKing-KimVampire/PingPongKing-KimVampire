import windowObservable from "../../WindowObservable.js";

class Player {
  constructor(clientInfo, playerList, sizeInfo) {
    this._initPlayerProperty(clientInfo, playerList, sizeInfo);
    this._subscribeWindow();
  }

  _initPlayerProperty(clientInfo, playerList, sizeInfo) {
    this.clientInfo = clientInfo;
    this.playerList = playerList;
    this.myTeam = this.playerList.find(
      (player) => player.clientId === clientInfo.id
    ).team;
    this.sizeInfo = {
      boardWidth: null,
      boardHeight: null,
      paddleWidth: null,
      paddleHeight: null,
      ballRadius: null,
    };
    this.sizeInfo = sizeInfo;
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
    this.updateSubBoardRectRef = this.updateSubBoardRect.bind(this);
    windowObservable.subscribeResize(this.updateSubBoardRectRef);
    this.updateOrientationRef = this.updateOrientation.bind(this);
    windowObservable.subscribeOrientationChange(this.updateOrientationRef);
    this.sendPaddlePositionRef = this.sendPaddlePosition.bind(this);
    windowObservable.subscribeMousemove(this.sendPaddlePositionRef);
  }

  unsubscribeWindow() {
    windowObservable.unsubscribeResize(this.updateSubBoardRectRef);
    windowObservable.unsubscribeOrientationChange(this.updateOrientationRef);
    windowObservable.unsubscribeMousemove(this.sendPaddlePositionRef);
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
      y = (yPos / this.subBoardRect.height) * this.sizeInfo.boardHeight;
      x =
        this.sizeInfo.boardWidth / 2 +
        ((xPos / this.subBoardRect.width) * this.sizeInfo.boardWidth) / 2;
    } else if (this.orientation === "portrait") {
      y =
        this.sizeInfo.boardHeight -
        (xPos / this.subBoardRect.width) * this.sizeInfo.boardHeight;
      x =
        this.sizeInfo.boardWidth / 2 +
        ((yPos / this.subBoardRect.height) * this.sizeInfo.boardWidth) / 2;
    }

    x = Math.max(
      this.sizeInfo.boardWidth / 2 + this.sizeInfo.paddleWidth / 2,
      Math.min(x, this.sizeInfo.boardWidth - this.sizeInfo.paddleWidth / 2)
    );
    y = Math.max(
      0 + this.sizeInfo.paddleHeight / 2,
      Math.min(y, this.sizeInfo.boardHeight - this.sizeInfo.paddleHeight / 2)
    );

    if (this.myTeam === "right") {
      x = x;
      y = y;
    } else if (this.myTeam === "left") {
      x = this.sizeInfo.boardWidth - x;
      y = y;
    }

    const msg = {
      event: "updatePaddleLocation",
      content: {
        xPosition: x,
        yPosition: y,
      },
    };
    this.clientInfo.socket.send(JSON.stringify(msg));
  }
}

export default Player;
