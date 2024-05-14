const socket = new WebSocket("ws://localhost:3001");

socket.addEventListener("open", function (event) {
//   socket.send(`{"init": "Hello Server"!}`);
});

socket.addEventListener("message", function (event) {
  console.log(event.data);
});

const body = document.querySelector("body");

document.querySelector("#createRoomBtn").addEventListener("click", function () {
  const clientId = document.querySelector("#clientIdInput").value;
  if (clientId) {
    const message = {
      sender: "hostClient",
      receiver: "server",
      event: "createPingpongRoom",
      clientId: parseInt(clientId),
    };
    socket.send(JSON.stringify(message));

    const roomIdHeading = document.createElement("h1");
    //방 번호는 추후 서버의 응답에 맞춘다.
    roomIdHeading.innerText = `Its host client ${clientId} && room ID is ${3}`;
    body.append(roomIdHeading);

    const startGameBtn = document.createElement("button");
    startGameBtn.innerText = "To All Client";
    const msg = {
      sender: "hostClient",
      receiver: "client",
      event: "startGame",
      clientList: [
        { clientId: 0, nickname: "김뱀파이어" },
        // 여기에 필요한 만큼 추가 클라이언트 정보를 추가하세요
      ],
    };
    startGameBtn.addEventListener("click", sendMsg(msg));
    body.append(startGameBtn);

    // 요소들을 숨기고 게임 시작 버튼을 표시
    document.getElementById("inputArea").style.display = "none";
  } else {
    alert("Please enter a client ID.");
  }
});

document.querySelector("#enterRoomBtn").addEventListener("click", function () {
  const roomId = document.querySelector("#roomIdInput").value;
  const clientIdInput = document.querySelector("#clientIdInput2").value;
  if (roomId && clientIdInput) {
    const message = {
      sender: "client",
      receiver: "hostClient",
      event: "startGame",
      roomId: parseInt(roomId),
      clientId: parseInt(clientIdInput),
      nickname: "김뱀파이어",
    };
    socket.send(JSON.stringify(message));

    const roomIdHeading = document.createElement("h1");
    //방 번호는 추후 서버의 응답에 맞춘다.
    roomIdHeading.innerText = `Its normal client ${clientIdInput} && room ID is ${roomId}`;
    body.append(roomIdHeading);

    const updatePaddleLocation = document.createElement("button");
    updatePaddleLocation.innerText = "To All Client";
    const msg = {
      sender: "client",
      receiver: "client",
      event: "updatePaddleLocation",
      clientId: parseInt(clientIdInput),
      xPosition: 23.412, //percentage
      yPosition: 32.412, //percentage
    };
    updatePaddleLocation.addEventListener("click", sendMsg(msg));
    body.append(updatePaddleLocation);

    const giveUpGame = document.createElement("button");
    giveUpGame.innerText = "To Host Client";
    const msg2 = {
      sender: "client",
      receiver: "hostClient",
      event: "giveUpGame",
      clientId: parseInt(clientIdInput),
    };
    giveUpGame.addEventListener("click", sendMsg(msg2));
    body.append(giveUpGame);
  } else {
    alert("Please enter a room ID.");
  }

  document.getElementById("inputArea").style.display = "none";
});

function sendMsg(msg) {
  return () => {
    socket.send(JSON.stringify(msg));
  };
}
