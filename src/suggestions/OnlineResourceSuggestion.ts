import { OnlineResourceData } from "src/utils/types";
import { format, parse } from "date-fns";
import {
    CalloutCollapseType,
    CalloutStyle,
    LinkFormat,
    SupportedOnlineResource,
} from "src/utils/settings";
import { Suggestion } from "./Suggestion";
import { OnlineResourceDAO } from "src/data_access/OnlineResourceDAO";

export class OnlineResourceSuggestion extends Suggestion {
    constructor(preview: string, content: string) {
        super(preview, content);
    }

    // Static methods

    static formatDate = (dateString: string): string => {
        const parsedDate = parse(dateString, "MM-yyyy", new Date());
        return format(parsedDate, "MMMM yyyy");
    };

    static formatIndented(
        paragraphs: string[],
        numIndents: number = 1
    ): string {
        const indent = "> ".repeat(numIndents);
        let outstring: string = "";
        for (let i = 0; i < paragraphs.length; i++) {
            outstring = outstring + `${indent}${paragraphs[i]}\n`;
            if (i != paragraphs.length - 1) {
                outstring += `${indent}\n`;
            } else {
                outstring += `> \n`;
            }
        }
        return outstring ? outstring : `${indent}%% Quote goes here! %%\n> \n`;
    }

    static filterFootnotes(content: string): string {
        const reg = /((\w+[.?!,"'])\d+)/g;
        const matches = content.matchAll(reg);
        if (matches) {
            console.debug("Found footnotes...");
            for (const match of matches) {
                console.debug(
                    "> Removing footnote. Replacing " +
                        match[1] +
                        " with " +
                        match[2]
                );
                content = content.replace(match[1], match[2]);
            }
        }
        return content;
    }

    static async create(
        url: string,
        style: CalloutStyle,
        collpseType: CalloutCollapseType
    ): Promise<OnlineResourceSuggestion> {
        // Fetch talk data
        const dao = new OnlineResourceDAO();
        const talkData: OnlineResourceData = await dao.fetchResource(
            url,
            "GET"
        );

        // Destructure
        const {
            month,
            year,
            title,
            author,
            authorRole,
            paragraphs,
            resourceType,
        } = talkData;
        const preview = `${title} (by ${author})`;
        const date = this.formatDate(`${month}-${year}`);
        const formattedParagraphs = this.filterFootnotes(
            style == CalloutStyle.Stylized
                ? this.formatIndented(paragraphs)
                : this.formatIndented(paragraphs, 2)
        );

        // Create the final suggestion text
        let content = "No Suggestion found!";
        if (!(style in CalloutStyle)) {
            console.warn(
                "Invalid quote callout style found. Invalid style:",
                style
            );
        }
        if (style === CalloutStyle.Stylized) {
            let headerFront = `>[!stylized] [${title}](${url})`;
            const attribution = `>> [!genconcitation]${collpseType}\n>> ${author}\n>> ${authorRole}\n>>${date}`;
            content =
                headerFront + "\n" + formattedParagraphs + attribution + "\n";
        } else if (style === CalloutStyle.Classic) {
            let calloutLabel: string;
            switch (resourceType) {
                case SupportedOnlineResource.GeneralConference:
                    calloutLabel = "gencon";
                    break;
                case SupportedOnlineResource.Magazine:
                    calloutLabel = "magazine";
                    break;
                case SupportedOnlineResource.Manual:
                    calloutLabel = "manual";
                    break;
                case SupportedOnlineResource.Music:
                    calloutLabel = "music";
                    break;
                case SupportedOnlineResource.Broadcasts:
                    calloutLabel = "broadcast";
                    break;
                case SupportedOnlineResource.Handbooks:
                    calloutLabel = "handbook";
                    break;
                default:
                    console.warn(
                        "Invalid resource type found. Invalid type:",
                        resourceType
                    );
                    calloutLabel = "note";
            }
            const formattedRole = !!authorRole ? "(" + authorRole + ")" : "";
            content = `> [!${calloutLabel}]${collpseType} ${author} ${formattedRole}\n${formattedParagraphs}> [${author}, _${title}_, ${date} ${resourceType}](${url})\n`;
        } else {
            throw new Error(
                "Invalid quote callout style error. Style: " + style
            );
        }

        return new OnlineResourceSuggestion(preview, content);
    }
}
