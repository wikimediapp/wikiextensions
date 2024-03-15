"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const models_1 = require("../models");
//Is possible url binding IP
class OkRu extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'okru';
        this.sources = [];
        this.extract = async (videoUrl) => {
            try {
                const userAgent = 'MiUserAgent/1.0'; // Define tu User-Agent aquí
                const options = {
                    headers: {
                        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
                    },
                };
                const { data } = await this.client.get(videoUrl.href, options).catch(() => {
                    throw new Error('Video not found');
                });
                const $ = (0, cheerio_1.load)(data);
                const dataOptions = $('div[data-module="OKVideo"]').attr('data-options').replace(/\\/g, "");
                console.log(dataOptions);
                const regex = /"ondemandHls":"([^"]+)"/; // Expresión regular para capturar la URL entre comillas
                const match = dataOptions.match(regex);
                let urlM3u8;
                if (match && match[1]) {
                    urlM3u8 = match[1];
                    console.log(urlM3u8); // Imprime la URL extraída
                }
                else {
                    console.log("No se encontró la URL en la cadena proporcionada.");
                }
                this.sources.push({
                    url: urlM3u8,
                    isM3U8: urlM3u8.includes('.m3u8'),
                });
                return this.sources;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
    }
}
exports.default = OkRu;
//# sourceMappingURL=okru.js.map