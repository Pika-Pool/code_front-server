if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');

const app = express();
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

app.listen(PORT, (...x) => {
	console.log(`Listening at http://localhost:${PORT}/`);
});
