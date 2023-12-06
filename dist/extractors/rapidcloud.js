"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const axios = require("axios");
const crypto_js_1 = __importDefault(require("crypto-js"));
const utils_1 = require("../utils");
const models_1 = require("../models");
class RapidCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'RapidCloud';
        this.sources = [];
        this.fallbackKey = 'c1d17096f2ca11b7';
        this.host = 'https://rapid-cloud.co';
        this.consumetApi = 'https://api.consumet.org';
        this.enimeApi = 'https://api.enime.moe';
        this.extract = async (videoUrl) => {
            var _a, _b;
            const result = {
                sources: [],
                intro: [],
                outro: [],
                subtitles: [],
            };
            try {
                const id = (_a = videoUrl.href.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
                const options = {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                };

                const getPairs = (scriptText) => {
                    const script = scriptText.toString();
                    const startOfSwitch = script.lastIndexOf('switch');
                    const endOfCases = script.indexOf('partKeyStartPosition');
                    const switchBody = script.slice(startOfSwitch, endOfCases);
                    const matches = switchBody.matchAll(/:[a-zA-Z0-9]+=([a-zA-Z0-9]+),[a-zA-Z0-9]+=([a-zA-Z0-9]+);/g);
                    const nums = [];
                    for (const match of matches) {
                        const innerNumbers = [];
                        for (const varMatch of [match[1], match[2]]) {
                            const regex = new RegExp(`${varMatch}=0x([a-zA-Z0-9]+)`, 'g');
                            const varMatches = [...script.matchAll(regex)];
                            const lastMatch = varMatches[varMatches.length - 1];
                            if (!lastMatch) return null;
                            const number = parseInt(lastMatch[1], 16);
                            innerNumbers.push(number);
                        }

                        nums.push([innerNumbers[0], innerNumbers[1]]);
                    }

                    return nums;
                }

                /*- branch: e1
                  script_url: https://megacloud.tv/js/player/a/prod/e1-player.min.js
                  - branch: e6
                  script_url: https://rapid-cloud.co/js/player/prod/e6-player-v2.min.js
                  - branch: e4
                  script_url: https://rabbitstream.net/js/player/prod/e4-player.min.js
                 */
                const fileUrl = 'https://megacloud.tv/js/player/a/prod/e1-player.min.js';
                const { data } = await axios.default.get(fileUrl);
                const pairs = getPairs(data);
                console.log(pairs);
                //console.log(data.intro);
                //console.log(data.outro);

                let res = null;
                res = await this.client.get(`https://${videoUrl.hostname}/embed-2/ajax/e-1/getSources?id=${id}`, options);
                console.log("res", res);
                let { data: { sources, tracks, intro }, } = res;
                //let decryptKey = await (await this.client.get('https://raw.githubusercontent.com/theonlymo/keys/e1/key')).data;
                let decryptKey = pairs;
                decryptKey = (0, utils_1.substringBefore)((0, utils_1.substringAfter)(decryptKey, '"blob-code blob-code-inner js-file-line">'), '</td>');
                if (!decryptKey) {
                    //decryptKey = await (await this.client.get('https://raw.githubusercontent.com/theonlymo/keys/e1/key')).data;
                    decryptKey = pairs;


                    const sourcesArray = sources.split('');
                    let extractedKey = '';
                    let currentIndex = 0;
                    for (const index of decryptKey) {
                        let start = index[0] + currentIndex;
                        let end = start + index[1];
                        for (let i = start; i < end; i++) {
                            extractedKey += res.data.sources[i];
                            sourcesArray[i] = '';
                        }
                        currentIndex += index[1];
                    }
                    decryptKey = extractedKey;
                    sources = sourcesArray.join('');
                    const decrypt = crypto_js_1.default.AES.decrypt(sources, decryptKey);
                    sources = JSON.parse(decrypt.toString(crypto_js_1.default.enc.Utf8));
                    console.log("sources", sources);
                }

                this.sources = sources === null || sources === void 0 ? void 0 : sources.map((s) => ({
                    url: s.file,
                    isM3U8: s.file.includes('.m3u8'),
                }));
                result.sources.push(...this.sources);
                if (videoUrl.href.includes(new URL(this.host).host)) {
                    result.sources = [];
                    this.sources = [];
                    for (const source of sources) {
                        const { data } = await this.client.get(source.file, options);
                        const m3u8data = data
                            .split('\n')
                            .filter((line) => line.includes('.m3u8') && line.includes('RESOLUTION='));
                        const secondHalf = m3u8data.map((line) => { var _a; return (_a = line.match(/RESOLUTION=.*,(C)|URI=.*/g)) === null || _a === void 0 ? void 0 : _a.map((s) => s.split('=')[1]); });
                        const TdArray = secondHalf.map((s) => {
                            const f1 = s[0].split(',C')[0];
                            const f2 = s[1].replace(/"/g, '');
                            return [f1, f2];
                        });
                        for (const [f1, f2] of TdArray) {
                            this.sources.push({
                                url: `${(_b = source.file) === null || _b === void 0 ? void 0 : _b.split('master.m3u8')[0]}${f2.replace('iframes', 'index')}`,
                                quality: f1.split('x')[1] + 'p',
                                isM3U8: f2.includes('.m3u8'),
                            });
                        }
                        result.sources.push(...this.sources);
                    }
                    if (intro.end > 1) {
                        result.intro = {
                            start: intro.start,
                            end: intro.end,
                        };
                    }
                }

                result.sources.push({
                    url: sources[0].file,
                    isM3U8: sources[0].file.includes('.m3u8'),
                    quality: 'auto',
                });
                result.intro = res.data.intro;
                result.outro = res.data.outro;
                result.subtitles = tracks
                    .map((s) => s.file
                        ? {
                            url: s.file,
                            lang: s.label ? s.label : 'Thumbnails',
                        }
                        : null)
                    .filter((s) => s);
                return result;
            }
            catch (err) {
                throw err;
            }
        };
        this.captcha = async (url, key) => {
            const uri = new URL(url);
            const domain = uri.protocol + '//' + uri.host;
            const { data } = await this.client.get(`https://www.google.com/recaptcha/api.js?render=${key}`, {
                headers: {
                    Referer: domain,
                },
            });
            const v = data === null || data === void 0 ? void 0 : data.substring(data.indexOf('/releases/'), data.lastIndexOf('/recaptcha')).split('/releases/')[1];
            //TODO: NEED to fix the co (domain) parameter to work with every domain
            const anchor = `https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=kr42069kr&k=${key}&co=aHR0cHM6Ly9yYXBpZC1jbG91ZC5ydTo0NDM.&v=${v}`;
            const c = (0, cheerio_1.load)((await this.client.get(anchor)).data)('#recaptcha-token').attr('value');
            // currently its not returning proper response. not sure why
            const res = await this.client.post(`https://www.google.com/recaptcha/api2/reload?k=${key}`, {
                v: v,
                k: key,
                c: c,
                co: 'aHR0cHM6Ly9yYXBpZC1jbG91ZC5ydTo0NDM.',
                sa: '',
                reason: 'q',
            }, {
                headers: {
                    Referer: anchor,
                },
            });
            return res.data.substring(res.data.indexOf('rresp","'), res.data.lastIndexOf('",null'));
        };
        // private wss = async (): Promise<string> => {
        //   let sId = '';
        //   const ws = new WebSocket('wss://ws1.rapid-cloud.ru/socket.io/?EIO=4&transport=websocket');
        //   ws.on('open', () => {
        //     ws.send('40');
        //   });
        //   return await new Promise((resolve, reject) => {
        //     ws.on('message', (data: string) => {
        //       data = data.toString();
        //       if (data?.startsWith('40')) {
        //         sId = JSON.parse(data.split('40')[1]).sid;
        //         ws.close(4969, "I'm a teapot");
        //         resolve(sId);
        //       }
        //     });
        //   });
        // };
    }
}
exports.default = RapidCloud;
//# sourceMappingURL=rapidcloud.js.map
