import { SERVER_ADDRESS } from "./PageRouter.js";
import { SERVER_PORT } from "./PageRouter.js";

export async function _connectLobbySocket(accessToken) {
	const lobbySocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby`, ['authorization', accessToken]);
	await new Promise(resolve => {
		lobbySocket.addEventListener("open", () => {
			resolve();
		});
	});
	return lobbySocket;
}
