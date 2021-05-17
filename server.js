import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import url from 'url';
import Song from './song.js';

const app = express();
dotenv.config();


const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/playlist' });

// Used for debugging purposes
function stringify(object) {
    return JSON.stringify(object);
}


wss.on('connection', async(ws, req) => {
    //send immediatly a feedback to the incoming connection  
    const params = new url.URLSearchParams(req.url.slice("/playlist".length)); 
    ws.send(`Connection made ${params}`);
    const lyrics = params.get('categoryName').split(/\s+/);
    const trackIds = [];

    // Return first 2 songs
    const song1 = await Song.searchSong(lyrics);
    trackIds.push(song1.trackId);
    await Song.getRandomLyrics(song1, lyrics);
    

    const song2 = await Song.searchSong(lyrics, trackIds);
    trackIds.push(song2.trackId);
    await Song.getRandomLyrics(song2, lyrics);
    console.log([song1, song2]);

    ws.send(stringify([song1, song2]));
    console.log(lyrics);


    ws.on('message', async(data) => {
        // Return subsequent songs
        try {
            const song = await Song.searchSong(lyrics, trackIds);
            trackIds.push(song.trackId);
            await Song.getRandomLyrics(song, lyrics);

            ws.send(stringify(song));
        } catch(e) {
            console.log(e);
            console.log(trackIds);
            console.log(lyrics);
            ws.send(e);
        }
    });    
});

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port}`);
});


// Recieved get request to start playlist