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

            if (!!parsedData.paragraphNums) {
                const { startNum: start, endNum: end } =
                    parsedData.paragraphNums;
                if (!!start) {
                    // Paragraphs are listed by consecutive numbers
                    const paragraphEnd = !!end ? end : start;

                    for (let i = start; i <= paragraphEnd; i++) {
                        const paragraph = $(`#p${i}`).text()?.trim();
                        if (paragraph) {
                            content.push(paragraph);
                        } else {
                            console.warn(`Paragraph #${i} not found.`);
                        }
                    }
                }
            } else if (!!parsedData.paragraphIDs) {
                const { startID, endID } = parsedData.paragraphIDs;
                console.log("Started parsing with id range:", startID, endID); // testing
                if (!!startID) {
                    // Paragraphs are listed by unique IDs

                    // Select all elements whose id starts with 'p'
                    const elements = $('[id^="p"]');

                    // Iterate over matched elements
                    let include = false;
                    let foundStart = false;
                    let foundEnd = false;
                    const paragraphEndID = !!endID ? endID : startID;
                    for (let i = 0; i <= elements.length; i++) {
                        const paragraph = $(elements[i]);
                        const paragraphID = paragraph.attr("id");
                        if (paragraphID === startID) {
                            console.log("Found starting paragraph!"); // testing
                            include = true;
                            foundStart = true;
                        }
                        if (paragraphID === paragraphEndID) {
                            console.log("Found ending paragraph!"); // testing
                            foundEnd = true;
                        }
                        if (include) {
                            console.log("Adding a paragraph to the result!"); // testing
                            content.push(paragraph.text()?.trim());
                        }
                        if (foundEnd) {
                            break;
                        }
                    }
                    if (!foundStart) {
                        console.warn(
                            `Starting paragraph with id="${startID}" not found.`
                        );
                    }
                    if (!foundEnd) {
                        console.warn(
                            `Ending paragraph with id="${endID}" not found.`
                        );
                    }
                } else {
                    throw new Error(
                        "Failed to find the starting paragraph by ID."
                    );
                }
            } else {
                console.warn(
                    "Failed to extract the paragraph data from the webpage."
                );
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
