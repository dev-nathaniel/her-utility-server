// MUST be first — patch Express globally
// import "./tracer/globalPatch.js";
import express from 'express';
// import { autoTrace } from './tracer/index.js';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { createServer, Server } from 'node:http';
import routes from "./controllers/index.js";

dotenv.config();

const mongoURI = process.env.MONGO_URI || '';

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const app = express();

// ONE LINE - that's it!
// autoTrace(app,
//    {
//   canvasId: 'your-canvas-id-from-dashboard',
//   wsUrl: 'wss://your-canvas-backend.com'
// }
// );


// Initialize tracer with Express
// const tracer = initTracer(app, {
//   output: (data) => console.log("[TRACE]", JSON.stringify(data)),
// });

const PORT = process.env.PORT || 5000;

const server = createServer(app);
export const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });

app.use('/api', routes);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export const transporter = nodemailer.createTransport({
  // Configure your SMTP settings here
  // host: process.env.SMTP_HOST,
  // port: Number(process.env.SMTP_PORT) || 587,
  // secure: false,
  // host: "smtp.gmail.com",
  // port: 465,
  // secure: true,
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // debug: true,
  // logger: true,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP configuration is valid, ready to send emails.");
  }
});