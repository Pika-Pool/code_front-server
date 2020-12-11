if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// requires
const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIGURE CORS OPTIONS
const cors = require('cors');
const corsOptions = {
	origin: process.env.ALLOWED_CORS_ORIGINS.split('|'),
	method: ['GET', 'POST', 'DELETE'],
	maxAge: 24 * 60 * 60,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// map to store socket room info
/* structure:
 * roomId : {['browser'/'cli'] : socket.id}
 */
const roomsMap = new Map();

const io = require('socket.io')(httpServer);

io.on('connection', socket => {
	const handshakeData = socket.request;

	socket.on('message', message => {
		console.log(`message recieved : ${message}`);
		socket.disconnect(true);
	});
});

httpServer.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}/`);
});
