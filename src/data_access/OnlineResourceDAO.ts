import { requestUrl } from "obsidian";
import * as cheerio from "cheerio";
import { OnlineResourceData } from "../utils/types";
import {
    NAME_QUERIES,
    AUTHOR_QUERIES,
    AUTHOR_TITLE,
    PARAGRAPHS_IN_BODY_QUERY,
} from "./config";
import { DataAccess } from "./DataAccess";
import { SupportedOnlineResource } from "src/utils/settings";

export class OnlineResourceDAO extends DataAccess {
    public async fetchResource(
        url: string,
        method: "GET" | "POST" | "PATCH"
    ): Promise<OnlineResourceData> {
        let title = "";
        let author: string = "";
        let authorRole = null;
        let paragraphs: string[] = [];
        let year: string | undefined;
        let month: string | undefined;
        let parsedData = this.parseURL(url);
        let lang = parsedData.queryParams.lang
            ? parsedData.queryParams.lang
            : "eng";

        let resourceType: SupportedOnlineResource;
        switch (parsedData.pathParts[1]) {
            case "general-conference":
                resourceType = SupportedOnlineResource.GeneralConference;
                break;
            case "ensign":
                resourceType = SupportedOnlineResource.Ensign;
                break;
            default:
                throw new Error(
                    `Tried to fetch from an unsupported type of URL: ${parsedData.pathParts[1]}`
                );
        }

        // Make network request
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
                authorRole,
                paragraphs,
                year,
                month,
                resourceType,
            };
        }

        try {
            // Get Title
            const $ = cheerio.load(response.json["content"]["body"]);
            const nameElement = this.cheerioFind($, NAME_QUERIES);
            title = nameElement ? nameElement.text().trim() : "Title not found";

            // Get Author
            const authorElement = this.cheerioFind($, AUTHOR_QUERIES);
            author = authorElement
                ? authorElement
                      .text()
                      .trim()
                      .replace(/^[B|b]y\s/, "")
                : "Unknown";
            if (author === "Unknown") console.log("Author not found");

            // Get Author title/role
            const authorRoleElement = this.cheerioFind($, AUTHOR_TITLE);
            authorRole = authorRoleElement
                ? authorRoleElement.text().trim()
                : null;
            if (!authorRole) console.log("Author role not found.");

            // Get the paragraphs
            if (!!parsedData.paragraphNums) {
                // Paragraphs are listed by paragraph number
                const { startNum: start, endNum: end } =
                    parsedData.paragraphNums;
                if (!!start) {
                    // Paragraphs are listed by consecutive numbers
                    const paragraphEnd = !!end ? end : start;

                    for (let i = start; i <= paragraphEnd; i++) {
                        const paragraph = $(`#p${i}`).text()?.trim();
                        if (paragraph) {
                            paragraphs.push(paragraph);
                        } else {
                            console.warn(`Paragraph #${i} not found.`);
                        }
                    }
                }
            } else if (!!parsedData.paragraphIDs) {
                // Paragraphs are listed by unique IDs
                const { startID, endID } = parsedData.paragraphIDs;
                console.log("Started parsing with id range:", startID, endID); // testing
                if (!!startID) {
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
                            paragraphs.push(paragraph.text()?.trim());
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
                console.log(
                    "Failed to extract the paragraph data from the webpage."
                );
            }

            year = parsedData.pathParts.at(-3);
            month = parsedData.pathParts.at(-2);

            if (!title || !paragraphs) {
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
            authorRole,
            paragraphs,
            year,
            month,
            resourceType,
        };
    }
}
