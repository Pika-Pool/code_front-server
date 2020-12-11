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

app.post('/login', (req, res) => {
	/*
	 * send an access token / roomId
	 * for establishing socket
	 */

	const roomId = uuid.v4();
	const exp = Date.now() + 24 * 60 * 60 * 1000; // 24hrs/1day

	roomsMap.set(roomId, { exp });

	console.log(`User ${roomID} logged in`);
	res.json({ exp, roomId });
});

const io = require('socket.io')(httpServer);

// validate auth credenttals sent in query
io.use((socket, next) => {
	const { query } = socket.handshake;
	const { roomId, clientType } = query;
	const x = authenticateHandshake({ socket, roomId, clientType }, next);
});

io.on('connection', socket => {
	const { query } = socket.handshake;
	const { roomId, clientType } = query;

	const roomDetails = roomsMap.get(roomId);
	roomsMap.set(roomId, { ...roomDetails, [clientType]: socket.id });

	socket.join(roomId);

	socket
		.on('message', message => {
			// any random messages or warnings
			console.log(`message recieved : ${message}`);
			socket.to(roomId).emit('message', message);
		})
		.on('appJsonData', jsonData => {
			// json containing data to build client's files
			socket.to(roomId).emit('appJsonData', jsonData);
		})
		.on('error', err => {
			// any errors from client
			console.log(
				`Error on: ${{ socketId: socket.id, roomId }}: ${error}`
			);
		})
		.on('disconnecting', reason => {
			// when client disconnects
			console.log(
				`${{ socketId: socket.id }} is disconnecting from ${{
					roomId,
				}}: ${reason}`
			);

			// if cli disconnects, end session for all clients
			// as cli is the authenticating node
			if (clientType === 'cli') {
				const browserSocket = roomsMap.get(roomId)['browser'];
				browserSocket.disconnect(true);
				roomsMap.delete(roomId);
			}
			// remove current client(browser for now) from roomsMap
			else {
				const clientObj = roomsMap.get(roomId);
				delete clientObj[clientType];
				roomsMap.set(roomId, clientObj);
			}
		});
});

httpServer.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}/`);
});

function authenticateHandshake({ socket, roomId, clientType }, cb) {
	const validClientTypes = ['browser', 'cli'];
	let err = null;

	if (!roomId || !clientType) {
		err = new Error(
			'roomId and clientType required in query to authenticate'
		);
	} else if (!roomsMap.has(roomId) || roomsMap.get(roomId).exp < Date.now()) {
		err = new Error('Invalid roomId / room expired');
	} else if (!validClientTypes.includes(clientType)) {
		err = new Error('Invalid client type');
	} else if (roomsMap.get(roomId)[clientType]) {
		err = new Error('Room already full');
	}

	// disconnect socket if not valid
	if (err) {
		socket.disconnect(true);
		console.log(`Error: ${err.message}`);
		return cb(err);
	}

	// authenticated successfully
	cb();
}
