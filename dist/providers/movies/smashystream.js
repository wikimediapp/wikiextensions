"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../../models");
const cheerio_1 = require("cheerio");
const extractors_1 = require("../../extractors");
class SmashyStream extends models_1.MovieParser {
    constructor() {
        super(...arguments);
        this.name = 'Smashystream';
        this.baseUrl = 'https://embed.smashystream.com';
        this.logo = 'https://smashystream.xyz/logo.png';
        this.classPath = 'MOVIES.SmashyStream';
        this.supportedTypes = new Set([models_1.TvType.MOVIE, models_1.TvType.TVSERIES]);
        this.search = async () => {
            throw new Error('Method not implemented.');
        };
        this.fetchMediaInfo = async () => {
            throw new Error('Method not implemented.');
        };
        this.fetchEpisodeServers = async (tmdbId, season, episode) => {
            try {
                const epsiodeServers = [];
                let url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}`;
                if (season) {
                    url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
                }
                const { data } = await this.client.get(url);
                const $ = (0, cheerio_1.load)(data);
                await Promise.all($('div#_default-servers a.server')
                    .map(async (i, el) => {
                    var _a;
                    const streamLink = (_a = $(el).attr('data-id')) !== null && _a !== void 0 ? _a : '';
                    epsiodeServers.push({
                        name: $(el).text().replace(/  +/g, ' ').trim(),
                        url: streamLink,
                    });
                })
                    .get());
                return epsiodeServers;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };

        this.fetchEpisodeServers2 = async (tmdbId) => {
            try {
                const epsiodeServers = [];
                let url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}`;
                const { data } = await this.client.get(url);
                const $ = (0, cheerio_1.load)(data);
                await Promise.all($('div#_default-servers a.server')
                    .map(async (i, el) => {
                    var _a;
                    const streamLink = (_a = $(el).attr('data-id')) !== null && _a !== void 0 ? _a : '';
                    epsiodeServers.push({
                        name: $(el).text().replace(/  +/g, ' ').trim(),
                        url: streamLink,
                    });
                })
                    .get());
                return epsiodeServers;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };

        this.fetchEpisodeSources = async (tmdbId, season, episode, server) => {
            try {
                const servers = await this.fetchEpisodeServers(tmdbId, season, episode);
               // const servers2 = await this.fetchEpisodeServers(tmdbId);
                const selectedServer = servers.find(s => s.name.toLowerCase() === (server === null || server === void 0 ? void 0 : server.toLowerCase()));
                const selectedServer2 = servers2.find(s => s.name.toLowerCase() === (server === null || server === void 0 ? void 0 : server.toLowerCase()));
                console.log("selectedServer:", selectedServer);
                console.log("selectedServer:", selectedServer2);
                if (!selectedServer) {
                    let url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}`;
                    console.log("url:", url);
                    if (season) {
                        url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
                        console.log("url2:", url);
                    }
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extract(new URL(url))));
                }
                if (selectedServer.url.includes('/ffix')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFfix(selectedServer.url)));
                }
                if (selectedServer.url.includes('/watchx')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyWatchX(selectedServer.url)));
                }
                if (selectedServer.url.includes('/nflim')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyNFlim(selectedServer.url)));
                }
                if (selectedServer.url.includes('/fx')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX(selectedServer.url)));
                }
                //Player F Serie
                if (selectedServer.url.includes('/fizzz.')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX2(selectedServer.url)));
                }
                //Player F Movie
                if (selectedServer.url.includes('/fizzz1')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX3(selectedServer.url)));
                }
                if (selectedServer.url.includes('/cf')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyCF(selectedServer.url)));
                }
                if (selectedServer.url.includes('/eemovie')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyEEMovie(selectedServer.url)));
                }
                return await this.fetchEpisodeSources(selectedServer.url, season, episode, server);
            }
            catch (err) {
               // throw new Error(err.message);
               // console.error(err.message);
               console.error(err);
              // res.error(500).send('Error: ' + err);
            }
        };

        this.fetchEpisodeSources2 = async (tmdbId, server) => {
            try {
                const servers = await this.fetchEpisodeServers2(tmdbId);
                const selectedServer = servers.find(s => s.name.toLowerCase() === (server === null || server === void 0 ? void 0 : server.toLowerCase()));           
                console.log("selectedServer:", selectedServer);
                if (!selectedServer) {
                    let url = `${this.baseUrl}/playere.php?tmdb=${tmdbId}`;
                    console.log("url:", url);
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extract(new URL(url))));
                }
                if (selectedServer.url.includes('/ffix')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFfix(selectedServer.url)));
                }
                if (selectedServer.url.includes('/watchx')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyWatchX(selectedServer.url)));
                }
                if (selectedServer.url.includes('/nflim')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyNFlim(selectedServer.url)));
                }
                if (selectedServer.url.includes('/fx')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX(selectedServer.url)));
                }
                //Player F Serie
                if (selectedServer.url.includes('/fizzz.')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX2(selectedServer.url)));
                }
                //Player F Movie
                if (selectedServer.url.includes('/fizzz1')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyFX3(selectedServer.url)));
                }
                if (selectedServer.url.includes('/cf')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyCF(selectedServer.url)));
                }
                if (selectedServer.url.includes('/eemovie')) {
                    return Object.assign({ headers: { Referer: this.baseUrl } }, (await new extractors_1.SmashyStream(this.proxyConfig, this.adapter).extractSmashyEEMovie(selectedServer.url)));
                }
                return await this.fetchEpisodeSources(selectedServer.url, season, episode, server);
            }
            catch (err) {
               // throw new Error(err.message);
               // console.error(err.message);
               console.error(err);
              // res.error(500).send('Error: ' + err);
            }
        };



    }
}
exports.default = SmashyStream;
//# sourceMappingURL=smashystream.js.map