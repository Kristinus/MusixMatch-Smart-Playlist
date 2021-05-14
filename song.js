import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const options = {
    protocol: 'http:',
    hostname: 'api.musixmatch.com',
    path: `/ws/1.1/track.lyrics.get?apikey=${process.env.API_KEY}`,
};

export default class Song {
    constructor(track) {
        this.trackId = track.track_id;
        this.title = track.track_name;
        this.artist = track.artist_name;
        this.hasLyrics = track.has_lyrics;
    }

    static async getLyrics(trackId) {
        const opt = {...options, path: `${options.path}&track_id=${trackId}`};
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
}