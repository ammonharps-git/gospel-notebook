import { GenConTalkData } from "src/utils/types";
import { format, parse } from "date-fns";
import { CalloutStyle, LinkFormat } from "src/utils/settings";
import { Suggestion } from "./Suggestion";
import { GenConDAO } from "src/data_access/GenConDAO";

export class GenConSuggestion extends Suggestion {
    private title;
    private authorName;
    private authorTitle;
    private date;
    private formattedParagraphs;
    private style;
    private url;

    constructor(
        title: string,
        authorName: string,
        authorTitle: string,
        date: string,
        formattedParagraphs: string,
        preview: string,
        style: CalloutStyle,
        url: string
    ) {
        super();
        this.title = title;
        this.authorName = authorName;
        this.authorTitle = authorTitle;
        this.date = date;
        this.formattedParagraphs = formattedParagraphs;
        this.preview = preview;
        this.style = style;
        this.url = url;
    }

    public getFinalSuggestion(): string {
        if (!(this.style in CalloutStyle)) {
            console.warn(
                "Invalid quote callout style found. Invalid style:",
                this.style
            );
        }
        if (this.style === CalloutStyle.Stylized) {
            let headerFront = `>[!stylized] [${this.title}](${this.url})`;
            const attribution = `>> [!genconcitation]\n>> ${this.authorName}\n>> ${this.authorTitle}\n>>${this.date}`;
            return (
                headerFront +
                "\n" +
                this.formattedParagraphs +
                attribution +
                "\n"
            );
        } else if (this.style === CalloutStyle.Classic) {
            return `> [!gencon] ${this.authorName} (${this.authorTitle})\n${this.formattedParagraphs}> [${this.authorName}, _${this.title}_, ${this.date} General Conference](${this.url})\n`;
        } else {
            throw new Error(
                "Invalid quote callout style error. Style: " + this.style
            );
        }
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
        return outstring ? outstring : "> > %% Quote goes here! %%\n> \n";
    }

    static async create(
        url: string,
        style: CalloutStyle
    ): Promise<GenConSuggestion> {
        // Fetch talk data
        const dao = new GenConDAO();
        const talkData: GenConTalkData = await dao.fetchGenConTalk(url, "GET");

        // Destructure
        const { month, year, title, author, content } = talkData;
        const authorName = author[0];
        const authorTitle = author[1];
        const preview = `${title} (by ${authorName})`;
        const date = this.formatDate(`${month}-${year}`);
        const formattedParagraphs =
            style == CalloutStyle.Stylized
                ? this.formatIndented(content)
                : this.formatIndented(content, 2);

        return new GenConSuggestion(
            title,
            authorName,
            authorTitle,
            date,
            formattedParagraphs,
            preview,
            style,
            url
        );
    }
}
