"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
const utils_1 = require("../../utils");
const utils_2 = require("../../utils");
const extractors_1 = require("../../extractors");
class MonoChinos extends models_1.AnimeParser {
    constructor() {
        super(...arguments);
        this.name = 'monoschinos';
        this.baseUrl = 'https://monoschinos2.com';
        this.logo = 'https://is3-ssl.mzstatic.com/image/thumb/Purple112/v4/7e/91/00/7e9100ee-2b62-0942-4cdc-e9b93252ce1c/source/512x512bb.jpg';
        this.classPath = 'ANIME.MonoChinos';
        /**
         * @param query Search query
         * @param page Page number (optional)
         */
        this.search = async (query, page = 1) => {
            const res = {
                currentPage: page,
                hasNextPage: false,
                totalPages: 0,
                results: [],
            };
            try {
                const { data } = await this.client.get(`${this.baseUrl}/buscar?q=${decodeURIComponent(query)}`);
                const $ = (0, cheerio_1.load)(data);
                res.hasNextPage = false;
                res.totalPages = 1;
                if (res.totalPages === 0 && !res.hasNextPage)
                    res.totalPages = 1;
                console.log("TOTAL PAGES: " + res.totalPages);
                $('.col-md-4').each((index, element) => {
                    const url = $(element).find('a').attr('href');
                    const id = url === null || url === void 0 ? void 0 : url.replace(this.baseUrl + "/anime/", "");
                    const title = $(element).find('.seristitles').text().trim();
                    const info = $(element).find('.seriesinfo').text().trim();
                    const type = info.split(" · ")[0];
                    let language;
                    if (url === null || url === void 0 ? void 0 : url.includes("latino")) {
                        language = models_1.Language.LATINO;
                    }
                    else if (url === null || url === void 0 ? void 0 : url.includes("castellano")) {
                        language = models_1.Language.CASTELLANO;
                    }
                    else {
                        language = models_1.Language.ORIGINAL;
                    }
                    res.results.push({
                        id: id,
                        title: title,
                        type: type.toUpperCase(),
                        //image: image,
                        url: url,
                        language: language
                    });
                });
                if (res.results.length === 0) {
                    res.totalPages = 0;
                    res.hasNextPage = false;
                }
                return res;
            }
            catch (err) {
                throw new Error(err);
            }
        };
        /**
         * @param id Anime id
         */
        this.fetchAnimeInfo = async (id) => {
            const info = {
                id: id,
                title: '',
            };
            try {
                const { data } = await this.client.get(`${this.baseUrl}/anime/${id}`);
                const $ = (0, cheerio_1.load)(data);
                info.id = id;
                info.title = $('div.chapterdetails').find('h1').text();
                //= $('div.chapterdetails').find('span.alterno').text();
                info.synopsis = $('div.chapterdetls2 p').text().trim();
                info.genres = getGenres($);
                //info.image = new types.Image($('div.chapterpic img').attr('src'), $('div.herobg img').attr('src'));
                //info.status = 'estreno' === $('div.butns button.btn1').text().toLowerCase().trim();
                info.episodes = getAnimeEpisodes($);
                info.totalEpisodes = info.episodes.length;
                const type = $('td.table1').filter((index, element) => $(element).text() === 'Tipo').next().text().trim();
                //console.log(tipo); // Debería imprimir "Pelicula"
                info.type = type.toUpperCase();
                //nfo.date = calendar.year;
                //anime.station = calendar.station;
                let language;
                if (id === null || id === void 0 ? void 0 : id.includes("latino")) {
                    language = models_1.Language.LATINO;
                }
                else if (id === null || id === void 0 ? void 0 : id.includes("castellano")) {
                    language = models_1.Language.CASTELLANO;
                }
                else {
                    language = models_1.Language.ORIGINAL;
                }
                info.language = language;
                return info;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        /**
         *
         * @param episodeId Episode id
         */
        this.fetchEpisodeSources = async (episodeId, server = models_1.StreamingServers.OkRu) => {
            let sources = {};
            if (episodeId.startsWith('http')) {
                const serverUrl = new URL(episodeId);
                let serverSource = (await getEpisodeServers(episodeId)).find(episode => episode.name === server);
                console.log(serverSource === null || serverSource === void 0 ? void 0 : serverSource.url);
                switch (server) {
                    case models_1.StreamingServers.OkRu:
                        return sources = {
                            embedURL: serverSource === null || serverSource === void 0 ? void 0 : serverSource.url
                        };
                    case models_1.StreamingServers.Filemoon:
                        return sources = {
                            headers: {
                                Referer: serverUrl.href, 'User-Agent': utils_2.USER_AGENT
                            },
                            sources: await new utils_1.Filemoon(this.proxyConfig, this.adapter).extract(serverUrl)
                        };
                    case models_1.StreamingServers.Mp4Upload:
                        return sources = {
                            headers: {
                                Referer: serverUrl.href, 'User-Agent': utils_2.USER_AGENT
                            },
                            sources: await new extractors_1.Mp4Upload(this.proxyConfig, this.adapter).extract(serverUrl)
                        };
                    default:
                        return sources = {}; // Puedes devolver un objeto vacío o undefined según tu lógica
                }
            }
            return sources; // Devuelve sources o undefined al final de la función
        };
        this.retrieveServerId = ($, index, subOrDub) => {
            return $(`div.ps_-block.ps_-block-sub.servers-${subOrDub} > div.ps__-list > div`)
                .map((i, el) => ($(el).attr('data-server-id') == `${index}` ? $(el) : null))
                .get()[0]
                .attr('data-id');
        };
        /**
         * NOT USED
         * @param page Page number
         */
        this.fetchRecentEpisodes = async (page = 1) => {
            try {
                const { data } = await this.client.get(`${this.baseUrl}/recently-updated?page=${page}`);
                const $ = (0, cheerio_1.load)(data);
                const hasNextPage = $('.pagination > li').length > 0
                    ? $('.pagination > li').last().hasClass('active')
                        ? false
                        : true
                    : false;
                const recentEpisodes = [];
                $('div.film_list-wrap > div').each((i, el) => {
                    var _a;
                    recentEpisodes.push({
                        id: (_a = $(el).find('div.film-poster > a').attr('href')) === null || _a === void 0 ? void 0 : _a.replace('/', ''),
                        image: $(el).find('div.film-poster > img').attr('data-src'),
                        title: $(el).find('div.film-poster > img').attr('alt'),
                        url: `${this.baseUrl}${$(el).find('div.film-poster > a').attr('href')}`,
                        episode: parseInt($(el).find('div.tick-eps').text().replace(/\s/g, '').replace('Ep', '').split('/')[0]),
                        episodelast: parseInt($(el).find('div.tick.ltr > div.tick-item.tick-sub').text()),
                        //type: $(el).find('span.fdi-item:not(.fdi-duration)').text().trim(),
                        duration: $(el).find('span.fdi-item.fdi-duration').text().trim(),
                    });
                });
                return {
                    currentPage: page,
                    hasNextPage: hasNextPage,
                    results: recentEpisodes,
                };
            }
            catch (err) {
                throw new Error('Something went wrong. Please try again later.');
            }
        };
        /**
         * @deprecated
         * @param episodeId Episode id
         */
        this.fetchEpisodeServers = (episodeId) => {
            throw new Error('Method not implemented.');
        };
    }
}
const baseUrl = 'https://monoschinos2.com';
/**
 * This function returns a list of servers where the episode is located.
 * The URLs of the servers are Base64 encoded.
 *
 * @param url
 * @returns
 */
async function getEpisodeServers(url) {
    let servers = [];
    const $ = (0, cheerio_1.load)((await axios_1.default.get(url)).data);
    $('div.playother').children().each((_i, element) => {
        console.log($(element).text().trim());
        console.log(Buffer.from($(element).attr('data-player'), 'base64').toString('binary'));
        let server = {
            name: $(element).text().trim(),
            url: Buffer.from($(element).attr('data-player'), 'base64').toString('binary')
        };
        servers.push(server);
    });
    return servers;
}
/**
*
* @param $
* @param element
* @returns
*/
async function getEpisodeByElement($, element) {
    var _a;
    let episode = {
        name: $(element).find('h2.animetitles').text().trim(),
        url: $(element).find('a').attr('href'),
        image: $(element).find('div.animeimgdiv img.animeimghv').attr('data-src'),
        number: parseInt($(element).find('div.positioning p').text().trim()),
        id: (_a = $(element).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.replace(baseUrl, "")
    };
    return episode;
}
/**
*
* @throws {Error}
* @returns
*/
async function getLastEpisodes() {
    let episodes = [];
    const $ = (0, cheerio_1.load)((await axios_1.default.get(baseUrl)).data);
    const elements = $('div.heroarea div.heroarea1 div.row').children();
    for (let i = 0; i < elements.length; i++) {
        if ($(elements[i]).children().length != 0) {
            episodes.push(await getEpisodeByElement($, elements[i]));
        }
    }
    return episodes;
}
/**
*
* @param $
* @returns
*/
function getGenres($) {
    let genres = [];
    $('div.chapterdetls2 table tbody a').each((_i, element) => {
        genres.push($(element).text().trim());
    });
    return genres;
}
/**
*
* @param $
* @returns
*/
function getAnimeEpisodes($) {
    let episodes = []; // Inicializa episodes como un array vacío
    $('div.heromain2 div.allanimes div.row').children().each((_i, element) => {
        if (parseInt($(element).attr('data-episode').trim()) != 0) {
            let id = $(element).find('a').attr('href');
            let episode = {
                number: parseInt($(element).attr('data-episode').trim()),
                image: $(element).find('img.animeimghv').attr('data-src'),
                name: $(element).find('img.animeimghv').attr('alt'),
                url: $(element).find('a').attr('href'),
                id: id.replace(baseUrl + "/ver/", "")
            };
            episodes.push(episode);
        }
    });
    return episodes;
}
const calendar = [
    [['enero', 'febrero', 'marzo'], 'invierno'],
    [['abril', 'mayo', 'junio'], 'primavera'],
    [['julio', 'agosto', 'septiembre'], 'verano'],
    [['octubre', 'noviembre', 'diciembre'], 'otoño'],
];
/**
* The calendar of the anime is extracted. The format shown on the
* website is 'dd from mm from yyyy'.
*
* @param element
* @returns the calendar of anime
*/
function getAnimeCalendar(element) {
    const date = element.find('ol.breadcrumb li.breadcrumb-item').text().trim().split(' ');
    if (date.length != 5)
        return { year: 0, station: null };
    else {
        for (let i = 0; i < calendar.length; i++) {
            if (calendar[i][0].includes(date[2].toLowerCase())) {
                return { year: parseInt(date.pop()), station: calendar[i][1].toString() };
            }
        }
    }
}
// (async () => {
//   const zoro = new Zoro();
//   const anime = await zoro.search('classroom of the elite');
//   const info = await zoro.fetchAnimeInfo(anime.results[0].id);
//   const sources = await zoro.fetchEpisodeSources(info.episodes![0].id);
//   console.log(sources);
// })();
exports.default = MonoChinos;
//# sourceMappingURL=monochinos.js.map