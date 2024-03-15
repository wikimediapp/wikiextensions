import { StreamingServers } from '../../src/models';
import { ANIME } from '../../src/providers';

jest.setTimeout(120000);

const zoro = new ANIME.Zoro();

/*test('returns a filled array of anime list', async () => {
  const data = await zoro.search('Overlord IV');
  expect(data.results).not.toEqual([]);
});

test('returns a filled object of anime data', async () => {
  const res = await zoro.search('Overlord IV');
  const data = await zoro.fetchAnimeInfo(res.results[3].id); // Overlord IV id
  expect(data).not.toBeNull();
  expect(data.description).not.toBeNull();
  expect(data.episodes).not.toEqual([]);
});*/

/*test('returns a filled array of recent animes', async () => {
  const data = await zoro.fetchRecentEpisodes();
  expect(data.results).not.toEqual([]);
});*/

test('returns a filled object of episode sources', async () => {
  //const res = await zoro.search('naruto');
  zoro.search('naruto').then((data) => {
    const filteredResults = data.results.filter(
      (result) => result.type === "TV"
    );
    const promises = filteredResults.map((result) => {
      console.log(result.id)
      return zoro.fetchAnimeInfo(result.id);
    });
    console.log("-------Buscando Todos los ID Consument--------");
    Promise.all(promises)
      .then((animeData) => {
        const filteredData = animeData.filter(
          (anime) => anime.malID === 20
        );
        zoro
          .fetchAnimeInfo(filteredData[0].id)
          .then((data) => {

            const filteredEpisodes = data.episodes!.filter(
              (episode) => episode.number == 1
            );
            const episodeNumbers = data.episodes!.map(
              (episode) => episode
            );
            zoro.fetchEpisodeSources(filteredEpisodes[0].id, StreamingServers.VidCloud)
              .then(async (datafinal) => {
                console.log(JSON.stringify(datafinal));
                expect(datafinal.sources).not.toEqual([]);
                
              });


          });
      });
  });

  //const info = await zoro.fetchAnimeInfo(res.results[2].id);
  //const data = await zoro.fetchEpisodeSources(info.episodes![0].id, StreamingServers.VidCloud); // Overlord IV episode 1 id
  //console.log(data);
  //expect(data.sources).not.toEqual([]);
});
