import { StreamingServers } from '../../src/models';
import { ANIME } from '../../src/providers';

jest.setTimeout(120000);

const mono = new ANIME.MonoChinos();

test('returns a filled array of anime list', async () => {
  const data = await mono.search('boruto');
  const episodes = await mono.fetchAnimeInfo(data.results[1].id);
  //console.log(episodes);
  /*data.results.forEach(datas => {
    
    console.log(datas);
  });*/
  /*console.log(data.results[2].id);
  console.log(data.results[2].title);
  console.log(data.results[2].language);
  const episodes = await mono.fetchAnimeInfo(data.results[0].id);
  console.log(episodes.type);
  console.log(data.results[2].title);
  //console.log(episodes);
  //console.log(episodes.episodes);
  //console.log(episodes.episodes![1].id);
  const sources = await mono.fetchEpisodeSources(episodes.episodes![1].url!, StreamingServers.OkRu)
  console.log(sources);*/
  expect(data.results).not.toEqual([]);
});