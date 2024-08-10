import windowObservable from "../../WindowObservable.js";

class Player {
	constructor(clientInfo) {
		this._initPlayerProperty(clientInfo);
		this._subscribeWindow();
	}

	_clearPlayer() {
		if (this.setIntervalRef) {
			clearInterval(this.setIntervalRef);
			this.setIntervalRef = null;
		}
		this.unsubscribeWindow();
	}

	_initPlayerProperty(clientInfo) {
		this.clientInfo = clientInfo;
		if (this.clientInfo.gameInfo.teamLeftList.find(player => player.id === clientInfo.id)) this.myTeam = "left";
		if (this.clientInfo.gameInfo.teamRightList.find(player => player.id === clientInfo.id)) this.myTeam = "right";
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

		this._initSubBoardrect();
		this.orientation = windowObservable.getOrientation();
		this.me = this.clientInfo.gameInfo.teamLeftList.find(leftPlayer => leftPlayer.id === this.clientInfo.id);
		if (!this.me) this.me = this.clientInfo.gameInfo.teamRightList.find(rightPlayer => rightPlayer.id === this.clientInfo.id);
		this._initKeyboardPressInfo();
		this._listenMyPaddleLocationUpdate();
	}

	_initSubBoardrect() {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				if (entry.target === this.subBoard) {
					this.updateSubBoardRect();
				}
			}
		});

		const updateOnLoad = () => {
			this.updateSubBoardRect();
			resizeObserver.observe(this.subBoard);
		};

		if (document.readyState === "complete" || document.readyState === "interactive") {
			updateOnLoad();
		} else {
			window.addEventListener("load", updateOnLoad);
		}
	}

	_listenMyPaddleLocationUpdate() {
		this.myPaddleLocation = {
			xPosition: 0,
			yPosition: 0,
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener("message", messageEvent => {
			const message = JSON.parse(messageEvent.data);
			const { event, content } = message;
			if (event === "notifyPaddleLocationUpdate" && content.clientId === this.clientInfo.id) {
				this.myPaddleLocation = {
					xPosition: content.xPosition,
					yPosition: content.yPosition,
				};
			}
		});
	}

	_initKeyboardPressInfo() {
		this.keyboardPressInfo = {
			ArrowLeft: false,
			ArrowUp: false,
			ArrowDown: false,
			ArrowRight: false,
			KeyA: false,
			KeyW: false,
			KeyS: false,
			KeyD: false,
		};
	}

	_subscribeWindow() {
		this.updateSubBoardRectRef = this.updateSubBoardRect.bind(this);
		windowObservable.subscribeResize(this.updateSubBoardRectRef);
		this.updateOrientationRef = this.updateOrientation.bind(this);
		windowObservable.subscribeOrientationChange(this.updateOrientationRef);
		this.sendPaddlePositionRef = this.sendPaddlePosition.bind(this);
		windowObservable.subscribeMousemove(this.sendPaddlePositionRef);
		windowObservable.subscribeTouchstart(this.sendPaddlePositionRef);
		windowObservable.subscribeTouchmove(this.sendPaddlePositionRef);
		this.updateKeyboardPressInfoByKeyDownRef = this._updateKeyboardPressInfoByKeyDown.bind(this);
		windowObservable.subscribeKeydown(this.updateKeyboardPressInfoByKeyDownRef);
		this.updateKeyboardPressInfoByKeyUpRef = this._updateKeyboardPressInfoByKeyUp.bind(this);
		windowObservable.subscribeKeyup(this.updateKeyboardPressInfoByKeyUpRef);
	}

	unsubscribeWindow() {
		windowObservable.unsubscribeResize(this.updateSubBoardRectRef);
		windowObservable.unsubscribeOrientationChange(this.updateOrientationRef);
		windowObservable.unsubscribeMousemove(this.sendPaddlePositionRef);
		windowObservable.unsubscribeTouchmove(this.sendPaddlePositionRef);
		windowObservable.unsubscribeTouchstart(this.sendPaddlePositionRef);
		windowObservable.unsubscribeKeydown(this.updateKeyboardPressInfoByKeyDownRef);
		windowObservable.unsubscribeKeyup(this.updateKeyboardPressInfoByKeyUpRef);
	}

	_updateKeyboardPressInfoByKeyDown(event) {
		if (!Object.keys(this.keyboardPressInfo).includes(event.code)) return;
		this.keyboardPressInfo[event.code] = true;
		this._sendRapidMoveByKeyboardInfo();

		const { ArrowLeft, ArrowUp, ArrowDown, ArrowRight } = this.keyboardPressInfo;
		if (ArrowLeft || ArrowUp || ArrowDown || ArrowRight) {
			this._sendPaddlePositionByKeyboardInfo();
			if (!this.setIntervalRef) {
				this.setIntervalRef = setInterval(() => {
					this._sendPaddlePositionByKeyboardInfo();
				}, 50);
			}
		}
	}

	_updateKeyboardPressInfoByKeyUp(event) {
		if (!Object.keys(this.keyboardPressInfo).includes(event.code)) return;
		this.keyboardPressInfo[event.code] = false;

		const { ArrowLeft, ArrowUp, ArrowDown, ArrowRight } = this.keyboardPressInfo;
		if (!ArrowLeft && !ArrowUp && !ArrowDown && !ArrowRight) {
			if (this.setIntervalRef) {
				clearInterval(this.setIntervalRef);
				this.setIntervalRef = null;
			}
		}
	}

	_sendRapidMoveByKeyboardInfo() {
		const { KeyA, KeyW, KeyS, KeyD } = this.keyboardPressInfo;
		let x = this.myPaddleLocation.xPosition;
		let y = this.myPaddleLocation.yPosition;

		if (KeyS && !KeyW && !KeyA && !KeyD) {
			this.moveRapidlyDown(x, y);
		} else if (!KeyS && KeyW && !KeyA && !KeyD) {
			this.moveRapidlyUp(x, y);
		} else if (!KeyS && !KeyW && KeyA && !KeyD) {
			this.moveRapidlyLeft(x, y);
		} else if (!KeyS && !KeyW && !KeyA && KeyD) {
			this.moveRapidlyRight(x, y);
		}
	}

	_sendPaddlePositionByKeyboardInfo() {
		const { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, KeyA, KeyW, KeyS, KeyD } = this.keyboardPressInfo;
		let x = this.myPaddleLocation.xPosition;
		let y = this.myPaddleLocation.yPosition;

		let horizontalOffset = 0;
		let verticalOffset = 0;
		if (ArrowLeft && !ArrowRight) horizontalOffset = 1;
		if (!ArrowLeft && ArrowRight) horizontalOffset = -1;
		if (ArrowUp && !ArrowDown) verticalOffset = -1;
		if (!ArrowUp && ArrowDown) verticalOffset = 1;

		if (this.orientation === "portrait") {
			[horizontalOffset, verticalOffset] = [verticalOffset, horizontalOffset];
		}
		if (this.myTeam === "left") {
			if (this.orientation === "portrait") horizontalOffset *= -1;
		} else if (this.myTeam === "right") {
			if (this.orientation === "landscape") horizontalOffset *= -1;
		}

		horizontalOffset *= this.sizeInfo.boardWidth / 20;
		verticalOffset *= this.sizeInfo.boardWidth / 20;

		let xPosition = x + horizontalOffset;
		let yPosition = y + verticalOffset;

		if (this.myTeam === "left") {
			xPosition = Math.max(0 + this.me.paddleWidth / 2, Math.min(xPosition, this.sizeInfo.boardWidth / 2 - this.me.paddleWidth / 2));
		} else if (this.myTeam === "right") {
			xPosition = Math.max(this.sizeInfo.boardWidth / 2 - this.me.paddleWidth / 2, Math.min(xPosition, this.sizeInfo.boardWidth - this.me.paddleWidth / 2));
		}
		yPosition = Math.max(0 + this.me.paddleHeight / 2, Math.min(yPosition, this.sizeInfo.boardHeight - this.me.paddleHeight / 2));

		if (horizontalOffset | verticalOffset) {
			this._sendUpdatePaddleLocation(xPosition, yPosition);
		}
	}

	moveRapidlyDown(x, y) {
		if (this.orientation === "landscape") {
			y = this.sizeInfo.boardHeight - this.me.paddleHeight / 2;
		} else if (this.orientation === "portrait") {
			if (this.myTeam === "right") {
				x = this.sizeInfo.boardWidth - this.me.paddleWidth / 2;
			} else if (this.myTeam === "left") {
				x = this.me.paddleWidth / 2;
			}
		}
		this._sendUpdatePaddleLocation(x, y);
	}

	moveRapidlyUp(x, y) {
		if (this.orientation === "landscape") {
			y = this.me.paddleHeight / 2;
		} else if (this.orientation === "portrait") {
			if (this.myTeam === "right") {
				x = this.sizeInfo.boardWidth / 2 + this.me.paddleWidth / 2;
			} else if (this.myTeam === "left") {
				x = this.sizeInfo.boardWidth / 2 - this.me.paddleWidth / 2;
			}
		}
		this._sendUpdatePaddleLocation(x, y);
	}

	moveRapidlyLeft(x, y) {
		if (this.orientation === "landscape") {
			if (this.myTeam === "right") {
				x = this.sizeInfo.boardWidth / 2 + this.me.paddleWidth / 2;
			} else if (this.myTeam === "left") {
				x = this.sizeInfo.boardWidth / 2 - this.me.paddleWidth / 2;
			}
		} else if (this.orientation === "portrait") {
			y = this.sizeInfo.boardHeight - this.me.paddleHeight / 2;
		}
		this._sendUpdatePaddleLocation(x, y);
	}

	moveRapidlyRight(x, y) {
		if (this.orientation === "landscape") {
			if (this.myTeam === "right") {
				x = this.sizeInfo.boardWidth - this.me.paddleWidth / 2;
			} else if (this.myTeam === "left") {
				x = this.me.paddleWidth / 2;
			}
		} else if (this.orientation === "portrait") {
			y = this.me.paddleHeight / 2;
		}
		this._sendUpdatePaddleLocation(x, y);
	}

	_sendUpdatePaddleLocation(x, y) {
		const msg = {
			event: "updatePaddleLocation",
			content: {
				xPosition: x,
				yPosition: y,
			},
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.send(JSON.stringify(msg));
	}

	updateSubBoardRect() {
		this.subBoardRect = this.subBoard.getBoundingClientRect();
	}

	updateOrientation(orientation) {
		this.orientation = orientation;
	}

	sendPaddlePosition(e) {
		let clientX;
		let clientY;

		if (e instanceof MouseEvent) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else if (e instanceof TouchEvent) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		}

		let x, y;
		const yPos = clientY - this.subBoardRect.top;
		const xPos = clientX - this.subBoardRect.left;

		if (this.orientation === "landscape") {
			y = (yPos / this.subBoardRect.height) * this.sizeInfo.boardHeight;
			x = this.sizeInfo.boardWidth / 2 + ((xPos / this.subBoardRect.width) * this.sizeInfo.boardWidth) / 2;
		} else if (this.orientation === "portrait") {
			y = this.sizeInfo.boardHeight - (xPos / this.subBoardRect.width) * this.sizeInfo.boardHeight;
			x = this.sizeInfo.boardWidth / 2 + ((yPos / this.subBoardRect.height) * this.sizeInfo.boardWidth) / 2;
		}

		x = Math.max(this.sizeInfo.boardWidth / 2 + this.me.paddleWidth / 2, Math.min(x, this.sizeInfo.boardWidth - this.me.paddleWidth / 2));
		y = Math.max(0 + this.me.paddleHeight / 2, Math.min(y, this.sizeInfo.boardHeight - this.me.paddleHeight / 2));

		if (this.myTeam === "right") {
			x = x;
			y = y;
		} else if (this.myTeam === "left") {
			x = this.sizeInfo.boardWidth - x;
			y = y;
		}

		this._sendUpdatePaddleLocation(x, y);
	}
}

export default Player;
