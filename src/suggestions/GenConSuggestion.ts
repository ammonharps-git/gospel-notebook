import { GenConTalkData } from "src/utils/types";
import { format, parse } from "date-fns";
import {
    CalloutCollapseType,
    CalloutStyle,
    LinkFormat,
} from "src/utils/settings";
import { Suggestion } from "./Suggestion";
import { GenConDAO } from "src/data_access/GenConDAO";

export class GenConSuggestion extends Suggestion {
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

    static async create(
        url: string,
        style: CalloutStyle,
        collpseType: CalloutCollapseType
    ): Promise<GenConSuggestion> {
        // Fetch talk data
        const dao = new GenConDAO();
        const talkData: GenConTalkData = await dao.fetchGenConTalk(url, "GET");

        // Destructure
        const { month, year, title, author, paragraphs } = talkData;
        const authorName = author[0];
        const authorTitle = author[1];
        const preview = `${title} (by ${authorName})`;
        const date = this.formatDate(`${month}-${year}`);
        const formattedParagraphs =
            style == CalloutStyle.Stylized
                ? this.formatIndented(paragraphs)
                : this.formatIndented(paragraphs, 2);

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
            const attribution = `>> [!genconcitation]${collpseType}\n>> ${authorName}\n>> ${authorTitle}\n>>${date}`;
            content =
                headerFront + "\n" + formattedParagraphs + attribution + "\n";
        } else if (style === CalloutStyle.Classic) {
            content = `> [!gencon]${collpseType} ${authorName} (${authorTitle})\n${formattedParagraphs}> [${authorName}, _${title}_, ${date} General Conference](${url})\n`;
        } else {
            throw new Error(
                "Invalid quote callout style error. Style: " + style
            );
        }

        return new GenConSuggestion(preview, content);
    }
}
