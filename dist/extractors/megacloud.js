"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
// https://megacloud.tv/embed-2/e-1/dBqCr5BcOhnD?k=1
const megacloud = {
    script: "https://megacloud.tv/js/player/a/prod/e1-player.min.js?v=",
    sources: "https://megacloud.tv/embed-2/ajax/e-1/getSources?id=",
};
function extractVariables(text, sourceName) {
    var _a, _b, _c, _d;
    // extract needed variables
    let allvars;
    if (sourceName !== "MEGACLOUD") {
        allvars =
            (_b = (_a = text
                .match(/const (?:\w{1,2}=(?:'.{0,50}?'|\w{1,2}\(.{0,20}?\)).{0,20}?,){7}.+?;/gm)) === null || _a === void 0 ? void 0 : _a.at(-1)) !== null && _b !== void 0 ? _b : "";
    }
    else {
        allvars =
            (_d = (_c = text
                .match(/const \w{1,2}=new URLSearchParams.+?;(?=function)/gm)) === null || _c === void 0 ? void 0 : _c.at(-1)) !== null && _d !== void 0 ? _d : "";
    }
    // and convert their values into an array of numbers
    const vars = allvars
        .slice(0, -1)
        .split("=")
        .slice(1)
        .map((pair) => Number(pair.split(",").at(0)))
        .filter((num) => num === 0 || num);
    return vars;
}
function getSecret(encryptedString, values) {
    let secret = "", encryptedSource = encryptedString, totalInc = 0;
    for (let i = 0; i < values[0]; i++) {
        let start, inc;
        switch (i) {
            case 0:
                (start = values[2]), (inc = values[1]);
                break;
            case 1:
                (start = values[4]), (inc = values[3]);
                break;
            case 2:
                (start = values[6]), (inc = values[5]);
                break;
            case 3:
                (start = values[8]), (inc = values[7]);
                break;
            case 4:
                (start = values[10]), (inc = values[9]);
                break;
            case 5:
                (start = values[12]), (inc = values[11]);
                break;
            case 6:
                (start = values[14]), (inc = values[13]);
                break;
            case 7:
                (start = values[16]), (inc = values[15]);
                break;
            case 8:
                (start = values[18]), (inc = values[17]);
        }
        const from = start + totalInc, to = from + inc;
        (secret += encryptedString.slice(from, to)),
            (encryptedSource = encryptedSource.replace(encryptedString.substring(from, to), "")),
            (totalInc += inc);
    }
    return { secret, encryptedSource };
}
function decrypt(encrypted, keyOrSecret, maybe_iv) {
    let key;
    let iv;
    let contents;
    if (maybe_iv) {
        key = keyOrSecret;
        iv = maybe_iv;
        contents = encrypted;
    }
    else {
        // copied from 'https://github.com/brix/crypto-js/issues/468'
        const cypher = Buffer.from(encrypted, "base64");
        const salt = cypher.subarray(8, 16);
        const password = Buffer.concat([
            Buffer.from(keyOrSecret, "binary"),
            salt,
        ]);
        const md5Hashes = [];
        let digest = password;
        for (let i = 0; i < 3; i++) {
            md5Hashes[i] = crypto_1.default.createHash("md5").update(digest).digest();
            digest = Buffer.concat([md5Hashes[i], password]);
        }
        key = Buffer.concat([md5Hashes[0], md5Hashes[1]]);
        iv = md5Hashes[2];
        contents = cypher.subarray(16);
    }
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = decipher.update(contents, typeof contents === "string" ? "base64" : undefined, "utf8") + decipher.final();
    return decrypted;
}
class MegaCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'megacloud';
        this.sources = [];
        this.fallbackKey = 'c1d17096f2ca11b7';
        this.host = 'https://megacloud.tv';
        this.extract = async (videoUrl) => {
            var _a, _b, _c, _d, _e;
            const result = {
                sources: [],
                subtitles: [],
            };
            const options = {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            };
            const extractedData = {
                tracks: [],
                intro: {
                    start: 0,
                    end: 0,
                },
                outro: {
                    start: 0,
                    end: 0,
                },
                sources: [],
            };
            try {
                const videoId = (_a = videoUrl.href.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
                const { data: srcsData } = await axios_1.default.get(megacloud.sources.concat(videoId || ""), {
                    headers: {
                        Accept: "*/*",
                        "X-Requested-With": "XMLHttpRequest",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                        Referer: videoUrl.href,
                    },
                });
                console.log(srcsData);
                if (!srcsData) {
                    throw new Error('Url may have an invalid video id.');
                }
                const encryptedString = srcsData.sources;
                if (srcsData.encrypted && Array.isArray(encryptedString)) {
                    extractedData.intro = srcsData.intro;
                    extractedData.outro = srcsData.outro;
                    extractedData.tracks = srcsData.tracks;
                    extractedData.sources = encryptedString.map((s) => ({
                        url: s.file,
                        type: s.type,
                    }));
                }
                let text;
                const { data } = await axios_1.default.get(megacloud.script.concat(Date.now().toString()));
                text = data;
                if (!text) {
                    throw new Error("Couldn't fetch script to decrypt resource");
                }
                const vars = extractVariables(text, "MEGACLOUD");
                const { secret, encryptedSource } = getSecret(encryptedString, vars);
                const decrypted = decrypt(encryptedSource, secret);
                try {
                    const sources = JSON.parse(decrypted);
                    extractedData.intro = srcsData.intro;
                    extractedData.outro = srcsData.outro;
                    extractedData.tracks = srcsData.tracks;
                    extractedData.sources = sources.map((s) => ({
                        url: s.file,
                        type: s.type,
                    }));
                    this.sources = sources === null || sources === void 0 ? void 0 : sources.map((s) => ({
                        url: s.file,
                        isM3U8: s.file.includes('.m3u8'),
                    }));
                    let track;
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
                    }
                    if (((_c = extractedData.intro) === null || _c === void 0 ? void 0 : _c.end) > 1) {
                        result.intro = {
                            start: extractedData.intro.start,
                            end: extractedData.intro.end,
                        };
                    }
                    if (((_d = extractedData.outro) === null || _d === void 0 ? void 0 : _d.end) > 1) {
                        result.outro = {
                            start: extractedData.outro.start,
                            end: extractedData.outro.end,
                        };
                    }
                    result.sources.push({
                        url: sources[0].file,
                        isM3U8: sources[0].file.includes('.m3u8'),
                        quality: 'auto',
                    });
                    result.subtitles = (_e = extractedData.tracks) === null || _e === void 0 ? void 0 : _e.map((s) => ({
                        url: s.file,
                        lang: s.label ? s.label : 'Thumbnails',
                        file: s.file,
                        kind: s.kind
                    }));
                    return result;
                    //return extractedData;
                }
                catch (error) {
                    throw new Error("Failed to decrypt resource");
                }
            }
            catch (err) {
                // console.log(err);
                throw err;
            }
        };
    }
}
exports.default = MegaCloud;
//# sourceMappingURL=megacloud.js.map