import { OkRu } from "../src/extractors";

const okru = new OkRu();

const testicles = async () => {
    const data = await okru.extract(new URL("https://ok.ru/videoembed/1186614544992"));
    //console.log(data)
};

testicles();