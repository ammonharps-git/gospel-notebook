// Some of the following code is adapted from @epeters3 in his repository https://github.com/epeters3/gospel-search

interface ParsedURL {
    protocol: string;
    hostname: string;
    pathParts: string[];
    queryParams: {
        lang?: string;
        id?: string;
    };
    paragraphNums?: {
        startNum?: number;
        endNum?: number;
    };
    paragraphIDs?: {
        startID?: string;
        endID?: string;
    };
}

// TODO refactor to have the paragraphs be nums or IDs

export abstract class DataAccess {
    protected parseURL(url: string): ParsedURL {
        console.log("url:", url); // testing
        const parsedUrl = new URL(url);
        console.log("parsedUrl:", parsedUrl); // testing
        const delimiters = /[/]/;
        console.log("pathname:", parsedUrl.pathname); // testing
        const pathParts = parsedUrl.pathname
            .split(delimiters)
            .filter((part) => part);
        console.log("search:", parsedUrl.search); // testing
        const searchParams = new URLSearchParams(parsedUrl.search);
        const queryParams: { [key: string]: string | undefined } = {};
        searchParams.forEach((value, key) => {
            console.log("section:", key, value); // testing
            queryParams[key] = value;
        });

        let paragraphs;
        let paragraphIDs;
        const id = queryParams.id;
        console.log(id); // testing
        if (typeof id === "string") {
            const regNumRange = /p(\d+)-p(\d+)/;
            const regNum = /p(\d+)/;
            const regIDs = /(p\w+)-(p\w+)/;
            const regID = /(p\w+)/;

            let match = id.match(regNumRange);
            if (match) {
                paragraphs = {
                    startNum: parseInt(match[1]),
                    endNum: parseInt(match[2]),
                };
            } else if (id.match(regNum)) {
                match = id.match(regNum);
                if (match) {
                    paragraphs = {
                        startNum: parseInt(match[1]),
                        endNum: parseInt(match[1]),
                    };
                }
            } else if (id.match(regIDs)) {
                match = id.match(regIDs);
                if (match) {
                    paragraphIDs = {
                        startID: match[1],
                        endID: match[2],
                    };
                }
            } else if (id.match(regID)) {
                match = id.match(regID);
                if (match) {
                    paragraphIDs = {
                        startID: match[1],
                        endID: match[1],
                    };
                }
            } else {
                console.warn(
                    "Failed to match paragraph identifiers to a valid pattern."
                );
            }
        } else {
            console.warn("Failed to find valid paragraph identifiers.");
        }

        return {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            pathParts,
            queryParams: {
                lang: queryParams.lang,
                id: queryParams.id,
            },
            paragraphNums: paragraphs,
            paragraphIDs,
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
