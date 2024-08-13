import { isSocketConnected } from "./Error/Error.js";

export const sendServer = (socket, message) => {
	try {
		if (isSocketConnected) socket.send(JSON.stringify(message));
	} catch (e) {}
};
