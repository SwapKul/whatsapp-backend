// importing
import express from 'express';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import Messages from './dbMessages.js';
import cors from 'cors';
import https from 'https';
import path from 'path';
import fs from 'fs';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1472764",
    key: "9c63da0144bd14c91c48",
    secret: "7641783b5195597a5cec",
    cluster: "ap2",
    useTLS: true
});

// middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// })

// db Config
const connection_url = 'mongodb://userMain1:UserMainPass435@ac-t70tzfy-shard-00-00.jgxbbz4.mongodb.net:27017,ac-t70tzfy-shard-00-01.jgxbbz4.mongodb.net:27017,ac-t70tzfy-shard-00-02.jgxbbz4.mongodb.net:27017/?ssl=true&replicaSet=atlas-9loqt9-shard-0&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection

db.once('open', () => {
    console.log('DB is connected');
    
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    
    changeStream.on('change', (change) => {
        console.log('A change occured');

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }
    })
})

// ?????

// api routes
app.get("/", (req, res)=> res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

const sslServer = https.createServer ({
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem'),
}, app);

// listen
sslServer.listen(port, () => console.log(`Listening on localhost:${port}`));