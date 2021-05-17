import dotenv from 'dotenv';
import e from 'express';
import http from 'http';

dotenv.config();

const lyricsOpt = {
    protocol: 'http:',
    hostname: 'api.musixmatch.com',
    path: `/ws/1.1/track.lyrics.get?apikey=${process.env.API_KEY}`,
};

const searchOpt = {
    protocol: 'http:',
    hostname: 'api.musixmatch.com',
    path: `/ws/1.1/track.search?apikey=${process.env.API_KEY}`,
};

export default class Song {
    constructor(track) {
        this.trackId = track.track_id;
        this.title = track.track_name;
        this.artist = track.artist_name;
        this.hasLyrics = track.has_lyrics;
    }

    /**
     * lyrics: list of strings
     * returns: first song given in resulting search
     */ 
    static async searchSong(lyrics, trackIds=[]) {
        encodeURIComponent(lyrics.join(" "));
        const opt = {...searchOpt, path: `${searchOpt.path}&q_lyrics=${lyrics}`};
        return new Promise( (res, reject) => {
            http.get(opt, _res => {
                const chunks = [];
                _res.on('data', chunk => {
                    chunks.push(chunk);
                });
                _res.on('end', async() => {
                    const body = Buffer.concat(chunks);
                    
                    const out = JSON.parse(body.toString());
                    if(out.message.header.status_code === 401) {
                        res.send("API KEY does not work");
                    }
                    const track_list = out.message.body.track_list;
                    const track = track_list.find( ({track}) => 
                        // Not in list of trackIds
                        !trackIds.includes(track.track_id)
                    );
                    
                    if (!track) {
                        reject("no more songs");
                    }
                    else {
                        const song = new Song(track.track);
                        if (song.hasLyrics) {
                            song.lyrics = await Song.getLyrics(song.trackId);
                            res(song);
                        }
                        else {
                            reject("last song has no lyrics");
                        }
                    }
                });
            }).on ('error', e => {
                console.error(e);
                reject(e);
            });
        });
    }

    /**
     * trackId: id of track
     * returns: list of string consisting of lyrics
     */ 
    static async getLyrics(trackId) {
        const opt = {...lyricsOpt, path: `${lyricsOpt.path}&track_id=${trackId}`};
        return new Promise((res, reject) => {
            http.get(opt, _res => {
            const chunks = [];
            _res.on('data', chunk => {
                chunks.push(chunk);
            });
            _res.on('end', d => {
                const body = Buffer.concat(chunks);
                const out = JSON.parse(body.toString());
    
                const lyrics = out.message.body.lyrics.lyrics_body;
                res(lyrics.split(/\s+/).slice(0,-11));
            });
            }).on('error', e => {
                console.error(e);
                reject(e);
            });
        });
    }

    /**
     * song: Song object to get random lyrics from
     * lyrics: list of lyrics to append to
     * num: num of random lyrics to get
     */ 
    static async getRandomLyrics(song, lyrics, num=5) {
        if(!song.hasLyrics) return;
        // const _lyrics = await Song.getLyrics(song.trackId);
        const _lyrics = song.lyrics;
        if(_lyrics.length === 0) return;
        for(let i=0; i<num; i++) {
            const idx = Math.floor(Math.random() * _lyrics.length);
            lyrics.push(_lyrics[idx]);
        }
    }
}