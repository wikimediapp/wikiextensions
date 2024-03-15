import { StreamingServers } from '../../src/models';
import { ANIME } from '../../src/providers';

jest.setTimeout(120000);

const mono = new ANIME.MonoChinos();

test('returns a filled array of anime list', async () => {
  const data = await mono.search('naruto');
  console.log(data.results[0].id);
  const episodes = await mono.fetchAnimeInfo(data.results[0].id);
  console.log(episodes.totalEpisodes);
  console.log(episodes);
  //console.log(episodes.episodes);
  //console.log(episodes.episodes![1].id);
  const sources = await mono.fetchEpisodeSources(episodes.episodes![1].url!, StreamingServers.OkRu)
  console.log(sources.embedURL);
  expect(data.results).not.toEqual([]);
});