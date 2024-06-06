import MovePaddleObserver from "./MovePaddleObserver.js";
import OrientationEventHandler from "./OrientationEventHandler.js";
import GameOrientationObserver from "./GameOrientationObserver.js";
import StartPlayObserver from "./StartPlayObserver.js";

class Player {
  constructor(clientInfo, playerList, gameInfo, eventHandler, subBoardRect) {
    this.clientInfo = clientInfo;

    this.playerList = playerList;
    this.myTeam = this.playerList.find((player)=>player.clientId === clientInfo.id).team;
    // console.log(this.myTeam);
    this.gameInfo = {
      boardWidth: null,
      boardHeight: null,
      paddleWidth: null,
      paddleHeight: null,
      ballRadius: null,
    };
    this.gameInfo = gameInfo;
    this.eventHandler = eventHandler;
    this.subBoardRect = subBoardRect;
    this.orientation = null;
    // this.gameObjectRenderer = gameObjectRenderer;

    //mousemove 변화 관찰
    const movePaddleObserver = new MovePaddleObserver(
      this.sendPaddlePosition.bind(this)
    );
    eventHandler.subscribe("mousemove", movePaddleObserver);

    // //mousedown 변화 관찰
    // const startPlayObserver = new StartPlayObserver(
    //   this.sendStartGame.bind(this)
    // );
    // eventHandler.subscribe("mousedown", startPlayObserver);

    //orientation 변화 관찰
    this.orientationEventHandler = new OrientationEventHandler();
    const updateOrientationObserver = new GameOrientationObserver(
      this.updateOrientation.bind(this)
    );
    this.orientationEventHandler.subscribe(updateOrientationObserver);
    //최초 orientation 감지
    this.orientationEventHandler.notify();
  }

  updateOrientation(orientation) {
    this.orientation = orientation;
  }

  sendPaddlePosition(e) {
    const yPos = e.clientY - this.subBoardRect.top;
    const xPos = e.clientX - this.subBoardRect.left;
    let x, y;

    // console.log(this.clientInfo);
    // console.log(this.myTeam);
    // console.log(this.gameInfo);

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
      // if (this.orientation === "landscape") {
      //   x = this.gameInfo.boardWidth - x;
      //   y = y;
      // } else if (this.orientation === "portrait") {
      // }
    }

    // console.log("y: ", y, "x: ", x);

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

    //내 패들을 렌더링하는것임 -> 그래도 게임규칙에 맞게 주는게 맞지 않을까? renderpaddle 재활용할 생각하는게 좋을듯
    // this.gameObjectRenderer.renderPaddle(
    //   y,
    //   x,
    //   this.referee.paddleHeight,
    //   this.referee.boardHeight,
    //   this.referee.boardWidth
    // );
  }

  // sendStartGame() {
  //   console.log("게임 시작해줘");
  //   // this.referee.startGame(this.gameObjectRenderer);
  // }
}

export default Player;
