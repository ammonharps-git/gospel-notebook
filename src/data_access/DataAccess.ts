// Some of the following code is adapted from @epeters3 in his repository https://github.com/epeters3/gospel-search

interface ParsedURL {
    protocol: string;
    hostname: string;
    pathParts: string[];
    queryParams: {
        lang?: string;
        id?: string;
    };
    paragraphs?: {
        start: number;
        end: number;
    };
}

export abstract class DataAccess {
    protected parseURL(url: string): ParsedURL {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split("/").filter((part) => part);

        const searchParams = new URLSearchParams(parsedUrl.search);
        const queryParams: { [key: string]: string | undefined } = {};
        searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });

        let paragraphs;
        const id = queryParams.id;
        if (typeof id === "string") {
            let match = id.match(/p(\d+)-p(\d+)/);
            if (match) {
                paragraphs = {
                    start: parseInt(match[1], 10),
                    end: parseInt(match[2], 10),
                };
            } else {
                match = id.match(/p(\d+)/);
                if (match) {
                    paragraphs = {
                        start: parseInt(match[1], 10),
                        end: parseInt(match[1], 10),
                    };
                }
            }
        }

        return {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            pathParts,
            queryParams: {
                lang: queryParams.lang,
                id: queryParams.id,
            },
            paragraphs,
        };
    }

    protected cheerioFind(
        $: cheerio.Root,
        queries: any[]
    ): cheerio.Cheerio | null {
        for (const query of queries) {
            const elements = $(query.name).filter((_, el) => {
                return Object.keys(query).every(
                    (key) => key === "name" || $(el).attr(key) === query[key]
                );
            });
            if (elements.length > 0) {
                return elements.first();
            }
        }
        return null;
    }

    protected extractURLPath(url: string): string | null {
        const genconregex =
            /https:\/\/www\.churchofjesuschrist\.org\/study(\/[\w-]+\/\d{4}\/\d{2}\/[\w-]+)/;
        const scriptureregex =
            /https:\/\/www\.churchofjesuschrist\.org\/study(\/[\w-]+\/[\w-]+\/[\w-]+\/[\w-]+)/;
        const match = url.match(genconregex)
            ? url.match(genconregex)
            : url.match(scriptureregex)
            ? url.match(scriptureregex)
            : null;

        return match ? match[1] : null;
    }

    protected buildAPIURL(lang: string, url: string) {
        let path = this.extractURLPath(url);
        return (
            `https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=${lang}&uri=` +
            path
        );
    }
}
