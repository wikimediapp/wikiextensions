import { VideoExtractor, IVideo } from '../models';
declare class OkRu extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    extract: (videoUrl: URL) => Promise<IVideo[]>;
}
export default OkRu;
