import dotenv from 'dotenv';
import Song from './song.js'
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cookieParser());
const port = 3000;


const options = {
    protocol: 'http:',
    hostname: 'api.musixmatch.com',
    path: `/ws/1.1/track.search?apikey=${process.env.API_KEY}`,
};

function getLyrics(trackId, callback) {
    const opt = {...options, path: `${options.path}&track_id=${trackId}`};
    const req = http.get(opt, _res => {
        const chunks = [];
        _res.on('data', chunk => {
            chunks.push(chunk);
        });
        _res.on('end', d => {
            const body = Buffer.concat(chunks);
            const out = JSON.parse(body.toString());

            const lyrics = out.message.body.lyrics.lyrics_body;
            callback(lyrics)
        });
    }).on('error', e => {
        console.error(e);
    })
    req.end();
}

function searchSong(lyrics, callback) {
    const opt = {...options, path: `${options.path}&q_lyrics=${lyrics}`};
    http.get(opt, _res => {
        const chunks = [];
        _res.on('data', chunk => {
            chunks.push(chunk);
        });
        _res.on('end', d => {
            const body = Buffer.concat(chunks);
            
            const out = JSON.parse(body.toString());
            if(out.message.header.status_code === 401) {
                res.send("API KEY does not work");
            }
            const track_list = out.message.body.track_list;
            callback(new Song(track_list[0].track));
        });
    }).on ('error', e => {
        console.error(e);
    });
}


app.get('/category/:categoryName', (req, res) => {
    const categoryName = encodeURIComponent(req.params.categoryName);
    const queryString = `&q_lyrics=${categoryName}`;
    if(req.cookies.lyrics === undefined) {
        // First 2 songs


        res.cookie("lyrics", 0);
        
    }

    else {
        const newLyrics = req.cookies.lyrics;
        res.cookie("lyrics", newLyrics);
        // new songs
    }    
    const opt = {...options, path: `${options.path}${queryString}`};
});

app.get('/clear', (req, res) => {
    res.clearCookie("requests");
    res.send("CLEARED");
})

app.listen(port, () => {
    console.log(`MusixMatch app listening at http://localhost:${port}`);
})