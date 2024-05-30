import MovePaddleObserver from "./MovePaddleObserver.js";
import OrientationEventHandler from "./OrientationEventHandler.js";
import GameOrientationObserver from "./GameOrientationObserver.js";
import TogglePlayObserver from "./TogglePlayObserver.js";

class Player {
  constructor(eventHandler, referee, gameObjectRenderer, subBoardRect) {
    this.referee = referee;
    this.gameObjectRenderer = gameObjectRenderer;
    this.subBoardRect = subBoardRect;

    const movePaddleObserver = new MovePaddleObserver(
      this.sendPaddlePosition.bind(this)
    );
    eventHandler.subscribe("mousemove", movePaddleObserver);
    const togglePlayObserver = new TogglePlayObserver(
      this.sendStartGame.bind(this)
    );
    eventHandler.subscribe("mousedown", togglePlayObserver);

    this.orientation = "landscape";
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
    console.log(this.orientation);
    const yPos = e.clientY - this.subBoardRect.top;
    const xPos = e.clientX - this.subBoardRect.left;
    let x, y;

    if (this.orientation === "landscape") {
      y = (yPos / this.subBoardRect.height) * this.referee.boardHeight;
      x =
        this.referee.boardWidth / 2 +
        ((xPos / this.subBoardRect.width) * this.referee.boardWidth) / 2;
    } else if (this.orientation === "portrait") {
      y =
        this.referee.boardHeight -
        (xPos / this.subBoardRect.width) * this.referee.boardHeight;
      x =
        this.referee.boardWidth / 2 +
        ((yPos / this.subBoardRect.height) * this.referee.boardWidth) / 2;
    }

    x = Math.max(
      this.referee.boardWidth / 2,
      Math.min(x, this.referee.boardWidth)
    );
    y = Math.max(0, Math.min(y, this.referee.boardHeight));
    this.referee.updatePaddlePosition(y, x);
    this.gameObjectRenderer.renderPaddle(
      y,
      x,
      this.referee.paddleHeight,
      this.referee.boardHeight,
      this.referee.boardWidth
    );
  }

  sendStartGame() {
    this.referee.startGame(this.gameObjectRenderer);
  }
}

export default Player;
