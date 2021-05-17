import dotenv from 'dotenv';
import Song from './song.js'
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cookieParser());




app.get('/category/:categoryName', async (req, res) => {
    if(req.cookies.lyrics === undefined) {
        const lyrics = req.params.categoryName.split(/\s+/);
        // First 2 songs
        const song1 = await Song.searchSong(lyrics);
        await Song.getRandomLyrics(lyrics, song1);
        const song2 = await Song.searchSong(lyrics);
        await Song.getRandomLyrics(lyrics, song2);
        
        res.cookie("lyrics", lyrics);
        res.send([song1, song2]);
    }

    else {
        const lyrics = req.cookies.lyrics;
        console.log(lyrics);
        const song = await Song.searchSong(lyrics);
        await Song.getRandomLyrics(lyrics, song);
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