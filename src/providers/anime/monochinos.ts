import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';

import {
  AnimeParser,
  ISearch,
  IAnimeInfo,
  MediaStatus,
  IAnimeResult,
  ISource,
  IAnimeEpisode,
  IEpisodeServer,
  StreamingServers,
  MediaFormat,
  SubOrSub,
  ProxyConfig,
} from '../../models';

import { StreamSB, RapidCloud, StreamTape, Filemoon } from '../../utils';
import { USER_AGENT } from '../../utils';
import { resolveAny } from 'dns';

class MonoChinos extends AnimeParser {
  override readonly name = 'monoschinos';
  protected override baseUrl = 'https://monoschinos2.com';
  protected override logo =
    'https://is3-ssl.mzstatic.com/image/thumb/Purple112/v4/7e/91/00/7e9100ee-2b62-0942-4cdc-e9b93252ce1c/source/512x512bb.jpg';
  protected override classPath = 'ANIME.MonoChinos';

  /**
   * @param query Search query
   * @param page Page number (optional)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    const res: ISearch<IAnimeResult> = {
      currentPage: page,
      hasNextPage: false,
      totalPages: 0,
      results: [],
    };

    try {
      const { data } = await this.client.get(
        `${this.baseUrl}/buscar?q=${decodeURIComponent(query)}`
      );
      const $ = load(data);

      res.hasNextPage = false;

      res.totalPages = 1;

      if (res.totalPages === 0 && !res.hasNextPage) res.totalPages = 1;

      console.log("TOTAL PAGES: " + res.totalPages);
      $('.col-md-4').each((index, element) => {
        const url = $(element).find('a').attr('href');
        const id = url?.replace(this.baseUrl + "/anime/", "");
        const title = $(element).find('.seristitles').text().trim();
        const info = $(element).find('.seriesinfo').text().trim();
        const type = info.split(" · ")[0];

        let language;
        if (url?.includes("latino")) {
          language = SubOrSub.DUB;
        }
        else if (url?.includes("castellano")) {
          language = SubOrSub.DUB;
        }
        else {
          language = SubOrSub.SUB;
        }
        res.results.push({
          id: id!,
          title: title,
          type: type.toUpperCase() as MediaFormat,
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
    } catch (err: any) {
      throw new Error(err);
    }
  };






  /**
   * @param id Anime id
   */
  override fetchAnimeInfo = async (id: string): Promise<IAnimeInfo> => {
    const info: IAnimeInfo = {
      id: id,
      title: '',
    };
    try {
      const { data } = await this.client.get(`${this.baseUrl}/anime/${id}`);
      const $ = load(data);

      info.id = id;
      info.title = $('div.chapterdetails').find('h1').text();
      //= $('div.chapterdetails').find('span.alterno').text();
      info.synopsis = $('div.chapterdetls2 p').text().trim();
      info.genres = getGenres($);
      //info.image = new types.Image($('div.chapterpic img').attr('src'), $('div.herobg img').attr('src'));
      //info.status = 'estreno' === $('div.butns button.btn1').text().toLowerCase().trim();
      info.episodes = getAnimeEpisodes($);
      //nfo.date = calendar.year;
      //anime.station = calendar.station;
      return info;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   * 
   * @param episodeId Episode id
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server: StreamingServers = StreamingServers.OkRu
  ): Promise<ISource> => {
    let sources: ISource = {};
    if (episodeId.startsWith('http')) {
      const serverUrl = new URL(episodeId);
      let serverSource = (await getEpisodeServers(episodeId)).find(episode => episode.name === server);
      console.log(serverSource?.url)
      switch (server) {
        case StreamingServers.OkRu:
          return sources = {
            embedURL: serverSource?.url
          };
        case StreamingServers.Filemoon:
          return sources = {
            headers: {
              Referer: serverUrl.href, 'User-Agent': USER_AGENT
            },
            sources: await new Filemoon(this.proxyConfig, this.adapter).extract(serverUrl)
          };
        default:
          return sources = {}; // Puedes devolver un objeto vacío o undefined según tu lógica
      }
    }
    return sources; // Devuelve sources o undefined al final de la función
  };

  private retrieveServerId = ($: any, index: number, subOrDub: 'sub' | 'dub') => {
    return $(`div.ps_-block.ps_-block-sub.servers-${subOrDub} > div.ps__-list > div`)
      .map((i: any, el: any) => ($(el).attr('data-server-id') == `${index}` ? $(el) : null))
      .get()[0]
      .attr('data-id')!;
  };

  /**
   * NOT USED
   * @param page Page number
   */
  fetchRecentEpisodes = async (page: number = 1): Promise<ISearch<IAnimeResult>> => {
    try {
      const { data } = await this.client.get(`${this.baseUrl}/recently-updated?page=${page}`);
      const $ = load(data);

      const hasNextPage =
        $('.pagination > li').length > 0
          ? $('.pagination > li').last().hasClass('active')
            ? false
            : true
          : false;

      const recentEpisodes: IAnimeResult[] = [];

      $('div.film_list-wrap > div').each((i, el) => {
        recentEpisodes.push({
          id: $(el).find('div.film-poster > a').attr('href')?.replace('/', '')!,
          image: $(el).find('div.film-poster > img').attr('data-src')!,
          title: $(el).find('div.film-poster > img').attr('alt')!,
          url: `${this.baseUrl}${$(el).find('div.film-poster > a').attr('href')}`,
          episode: parseInt(
            $(el).find('div.tick-eps').text().replace(/\s/g, '').replace('Ep', '').split('/')[0]
          ),
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
    } catch (err) {
      throw new Error('Something went wrong. Please try again later.');
    }
  };
  /**
   * @deprecated
   * @param episodeId Episode id
   */
  override fetchEpisodeServers = (episodeId: string): Promise<IEpisodeServer[]> => {
    throw new Error('Method not implemented.');
  };
}


const baseUrl = 'https://monoschinos2.com';

/**
 * This function returns a list of servers where the episode is located.
 * The URLs of the servers are Base64 encoded.
 * 
 * @param url
 * @returns
 */
async function getEpisodeServers(url: string): Promise<IEpisodeServer[]> {
  let servers: IEpisodeServer[] = [];
  const $ = load((await axios.get(url)).data);
  $('div.playother').children().each((_i, element) => {
    console.log($(element).text().trim())
    console.log(Buffer.from($(element).attr('data-player')!, 'base64').toString('binary'))
    let server: IEpisodeServer = {
      name: $(element).text().trim(),
      url: Buffer.from($(element).attr('data-player')!, 'base64').toString('binary')
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
async function getEpisodeByElement($: CheerioAPI, element: any): Promise<IAnimeEpisode> {
  let episode: IAnimeEpisode = {
    name: $(element).find('h2.animetitles').text().trim(),
    url: $(element).find('a').attr('href'),
    image: $(element).find('div.animeimgdiv img.animeimghv').attr('data-src'),
    number: parseInt($(element).find('div.positioning p').text().trim()),
    id: $(element).find('a').attr('href')?.replace(baseUrl, "")!
  };

  return episode;
}

/**
* 
* @throws {Error}
* @returns 
*/
async function getLastEpisodes(): Promise<IAnimeEpisode[]> {
  let episodes: IAnimeEpisode[] = [];
  const $ = load((await axios.get(baseUrl)).data);
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
function getGenres($: CheerioAPI): string[] {
  let genres: string[] = [];
  $('div.chapterdetls2 table tbody a').each((_i, element) => {
    genres.push($(element).text().trim())
  });
  return genres;
}

/**
* 
* @param $ 
* @returns 
*/
function getAnimeEpisodes($: CheerioAPI): IAnimeEpisode[] {
  let episodes: IAnimeEpisode[] = []; // Inicializa episodes como un array vacío
  $('div.heromain2 div.allanimes div.row').children().each((_i, element) => {
    if (parseInt($(element).attr('data-episode')!.trim()) != 0) {
      let id = $(element).find('a').attr('href')!;
      let episode: IAnimeEpisode = {
        number: parseInt($(element).attr('data-episode')!.trim()),
        image: $(element).find('img.animeimghv').attr('data-src'),
        name: $(element).find('img.animeimghv').attr('alt'),
        url: $(element).find('a').attr('href'),
        id: id.replace(baseUrl + "/ver/", "")!
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

interface ClimaticCalendar {
  year: number;
  station: null | string;
}




/**
* The calendar of the anime is extracted. The format shown on the 
* website is 'dd from mm from yyyy'.
* 
* @param element 
* @returns the calendar of anime
*/
function getAnimeCalendar(element: any) {
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

export default MonoChinos;
