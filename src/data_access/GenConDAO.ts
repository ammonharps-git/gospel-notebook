import { requestUrl } from "obsidian";
import * as cheerio from "cheerio";
import { GenConTalkData } from "../utils/types";
import {
    NAME_QUERIES,
    AUTHOR_QUERIES,
    AUTHOR_TITLE,
    PARAGRAPHS_IN_BODY_QUERY,
} from "./config";
import { DataAccess } from "./DataAccess";

export class GenConDAO extends DataAccess {
    public async fetchGenConTalk(
        url: string,
        method: "GET" | "POST" | "PATCH"
    ): Promise<GenConTalkData> {
        let title = "";
        let author: string[] = [];
        let content: string[] = [];
        let year = "";
        let month = "";
        let setting = "";
        let parsedData = this.parseURL(url);
        let lang = parsedData.queryParams.lang
            ? parsedData.queryParams.lang
            : "eng";

        if (parsedData.pathParts[1] !== "general-conference") {
            throw new Error(
                "GenConDAO can only refernce talks from General Conference."
            );
        }

        let talkurl = this.buildAPIURL(lang, url);

        const response = await requestUrl({
            url: talkurl,
            method: method,
            headers: {},
        });
        if (response.status === 401 || response.status === 402) {
            return {
                title,
                author,
                content,
                year,
                month,
                setting,
            };
        }

        try {
            const $ = cheerio.load(response.json["content"]["body"]);
            const nameElement = this.cheerioFind($, NAME_QUERIES);
            title = nameElement ? nameElement.text().trim() : "Title not found";

            const authorElement = this.cheerioFind($, AUTHOR_QUERIES);
            let authorname = authorElement
                ? authorElement
                      .text()
                      .trim()
                      .replace(/^[B|b]y\s/, "")
                : "Author not found";
            const authorRoleElement = this.cheerioFind($, AUTHOR_TITLE);
            let authorrole = authorRoleElement
                ? authorRoleElement.text().trim()
                : "Author role not found";
            author.push(authorname);
            author.push(authorrole);

            if (parsedData.paragraphs) {
                const { start, end } = parsedData.paragraphs;
                const paragraphEnd = end !== undefined ? end : start;

                for (let i = start; i <= paragraphEnd; i++) {
                    const paragraph = $(`#p${i}`).text()?.trim();
                    if (paragraph) {
                        content.push(paragraph);
                    } else {
                        console.warn(`Paragraph #${i} not found.`);
                    }
                }
            }

            year = parsedData.pathParts[2];
            month = parsedData.pathParts[3];
            setting = "General Conference";

            if (!title || !content) {
                throw new Error(
                    "Unable to extract the necessary data from the webpage."
                );
            }
        } catch (error) {
            console.error("Error fetching or parsing data:", error);
        }
        return {
            title,
            author,
            content,
            year,
            month,
            setting,
        };
    }
}
