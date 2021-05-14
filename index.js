import dotenv from 'dotenv';
import Song from './song.js'
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cookieParser());

const options = {
    protocol: 'http:',
    hostname: 'api.musixmatch.com',
    path: `/ws/1.1/track.search?apikey=${process.env.API_KEY}`,
};



async function searchSong(lyrics) {
    encodeURIComponent(lyrics.join(" "));
    const opt = {...options, path: `${options.path}&q_lyrics=${lyrics}`};
    return new Promise( (res, reject) => {
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
                res(new Song(track_list[0].track));
            });
        }).on ('error', e => {
            console.error(e);
            reject(e);
        });
    });
}

async function getRandomLyrics(lyrics, song) {
    const _lyrics = await Song.getLyrics(song.trackId);
    for(let i=0; i<5; i++) {
        const idx = Math.round(Math.random() * _lyrics.length);
        lyrics.push(_lyrics[idx]);
    }
}


app.get('/category/:categoryName', async (req, res) => {
    if(req.cookies.lyrics === undefined) {
        const lyrics = req.params.categoryName.split(/\s+/);
        // First 2 songs
        const song1 = await searchSong(lyrics);
        await getRandomLyrics(lyrics, song1);
        const song2 = await searchSong(lyrics);
        await getRandomLyrics(lyrics, song2);
        
        res.cookie("lyrics", lyrics);
        res.send([song1, song2]);
    }

    else {
        const lyrics = req.cookies.lyrics;
        console.log(lyrics);
        const song = await searchSong(lyrics);
        await getRandomLyrics(lyrics, song);
        console.log(lyrics);
        res.cookie("lyrics", lyrics);
        res.send(song)
    }
});

app.get('/clear', (req, res) => {
    res.clearCookie("lyrics");
    res.send("CLEARED");
})

app.listen(process.env.PORT, () => {
    console.log(`MusixMatch app listening at http://localhost:${process.env.PORT}`);
})