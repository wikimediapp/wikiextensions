import { MangaParser, ISearch, IMangaInfo, IMangaResult, IMangaChapterPage } from '../../models';
declare class AsuraScans extends MangaParser {
    readonly name = "AsuraScans";
    protected baseUrl: string;
    protected logo: string;
    protected classPath: string;
    constructor();
    fetchMangaInfo: (mangaId: string) => Promise<IMangaInfo>;
    fetchChapterPages: (chapterId: string) => Promise<IMangaChapterPage[]>;
    /**
     *
     * @param query Search query
     */
    search: (query: string) => Promise<ISearch<IMangaResult>>;
}
export default AsuraScans;
