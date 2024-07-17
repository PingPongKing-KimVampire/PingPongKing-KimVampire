import { SERVER_ADDRESS } from "./PageRouter.js";
import { SERVER_PORT } from "./PageRouter.js";

export async function _connectLobbySocket(id, accessToken) {
	const lobbySocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`, ['authorization', accessToken]);
	await new Promise(resolve => {
		lobbySocket.addEventListener("open", () => {
			resolve();
		});
	});
	// const enterLobbyMessage = {
	// 	event: "enterLobby",
	// 	content: {
	// 		clientId: id,
	// 	},
	// };
	// lobbySocket.send(JSON.stringify(enterLobbyMessage));
	// return new Promise(resolve => {
	// 	const listener = function (messageEvent) {
	// 		const { event, content } = JSON.parse(messageEvent.data);
	// 		if (event === "enterLobbyResponse" && content.message === "OK") {
	// 			lobbySocket.removeEventListener("message", listener);
	// 			resolve(lobbySocket);
	// 		}
	// 	};
	// 	lobbySocket.addEventListener("message", listener);
	// });
}
