import windowObservable from "../../WindowObservable.js";

class Player {
	constructor(clientInfo) {
		this._initPlayerProperty(clientInfo);
		this._subscribeWindow();
	}

  _initPlayerProperty(clientInfo) {
    this.clientInfo = clientInfo;
    if (
      this.clientInfo.gameInfo.teamLeftList.find(
        (player) => player.id === clientInfo.id
      )
    )
      this.myTeam = "left";
    if (
      this.clientInfo.gameInfo.teamRightList.find(
        (player) => player.id === clientInfo.id
      )
    )
      this.myTeam = "right";
    this.sizeInfo = {
      boardWidth: null,
      boardHeight: null,
      ballRadius: null,
    };
    this.sizeInfo = this.clientInfo.gameInfo.sizeInfo;
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
    this.me = this.clientInfo.gameInfo.teamLeftList.find((leftPlayer)=>leftPlayer.id===this.clientInfo.id);
    if(!this.me)
      this.me = this.clientInfo.gameInfo.teamRightList.find((rightPlayer)=>rightPlayer.id===this.clientInfo.id);
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
			x = this.sizeInfo.boardWidth / 2 + ((xPos / this.subBoardRect.width) * this.sizeInfo.boardWidth) / 2;
		} else if (this.orientation === "portrait") {
			y = this.sizeInfo.boardHeight - (xPos / this.subBoardRect.width) * this.sizeInfo.boardHeight;
			x = this.sizeInfo.boardWidth / 2 + ((yPos / this.subBoardRect.height) * this.sizeInfo.boardWidth) / 2;
		}

    x = Math.max(
      this.sizeInfo.boardWidth / 2 + this.me.paddleWidth / 2,
      Math.min(x, this.sizeInfo.boardWidth - this.me.paddleWidth / 2)
    );
    y = Math.max(
      0 + this.me.paddleHeight / 2,
      Math.min(y, this.sizeInfo.boardHeight - this.me.paddleHeight / 2)
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
		this.clientInfo.gameInfo.pingpongRoomSocket.send(JSON.stringify(msg));
	}
}

export default Player;
