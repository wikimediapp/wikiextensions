import { VideoExtractor, IVideo, ISubtitle2 } from '../models';
declare class MegaCloud extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly fallbackKey;
    private readonly host;
    extract: (videoUrl: URL) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle2[];
    }>;
}
export default MegaCloud;
