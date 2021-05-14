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
        this.track_id = track.track_id;
        this.title = track.track_name;
        this.artist = track.artist_name;
        this.has_lyrics = track.has_lyrics;
    }

    getLyrics() {
        if(this.has_lyrics) {
            const opt = {...options, path: `${options.path}&track_id=${this.track_id}`};
            const req = http.get(opt, _res => {
                const chunks = [];
                _res.on('data', chunk => {
                    chunks.push(chunk);
                });
                _res.on('end', d => {
                    const body = Buffer.concat(chunks);
                    const out = JSON.parse(body.toString());

                    const lyrics = out.message.body.lyrics.lyrics_body;
                    this.lyrics = lyrics;
                });
            }).on('error', e => {
                console.error(e);
            })
            req.end();
            return this.lyrics;
        }
    }
}