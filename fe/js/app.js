import PageRouter from "./PageRouter.js";

const pageRouter = new PageRouter();
pageRouter.renderPage('login');

// const socket = new WebSocket('ws://${ip주소}:3001');

// socket.addEventListener('open', () => {
//     const pageRouter = new PageRouter();
//     pageRouter.renderPage('login', socket);
// })