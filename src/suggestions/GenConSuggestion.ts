import { GenConTalkData } from "src/utils/types";
import { format, parse } from "date-fns";
import { CalloutStyle, LinkFormat } from "src/utils/settings";
import { Suggestion } from "./Suggestion";
import { GenConDAO } from "src/data_access/GenConDAO";

// TOOD make static method rather than load
export class GenConSuggestion extends Suggestion {
    private text: string;
    public previewText: string;
    private data: GenConTalkData;
    private date: string;
    private dao: GenConDAO;

    constructor(
        public pluginName: string,
        public url: string,
        public linkType: LinkFormat,
        public quoteStyle: CalloutStyle
    ) {
        super();
        this.dao = new GenConDAO();
    }

    private convertDate = (dateString: string): string => {
        // Parse the date string
        const parsedDate = parse(dateString, "MM-yyyy", new Date());
        // Format the parsed date to the desired format
        return format(parsedDate, "MMMM yyyy");
    };

    public getReplacement(): string {
        this.text = this.toText();
        if (this.quoteStyle === CalloutStyle.Stylized) {
            let headerFront = `>[!gencon] [${this.data.title}](${this.url})`;
            const attribution = `>> [!genconcitation]\n>> ${this.data.author[0]}\n>> ${this.data.author[1]}\n>>${this.date}`;
            return headerFront + "\n" + this.text + attribution + "\n";
        } else if (this.quoteStyle === CalloutStyle.Classic) {
            return `> [!quote] ${this.data.author[0]} (${this.data.author[1]})\n> ${this.text}> [${this.data.author[0]}, ${this.data.title}, ${this.date} General Conference](${this.url})`;
        } else {
            throw new Error("Invalid Callout style found: " + this.quoteStyle);
        }
    }

    private toText(): string {
        let outstring: string = "";
        this.data.content.forEach((element) => {
            outstring = outstring + `> ${element} \n>\n `;
        });
        return outstring;
    }

    public async loadTalk(): Promise<void> {
        this.data = await this.dao.fetchGenConTalk(this.url, "GET");
        this.previewText = `_${this.data.title}_ by ${this.data.author[0]}`;
        this.date = this.convertDate(`${this.data.month}-${this.data.year}`);
        this.text = this.toText();
    }

    // public render(el: HTMLElement): void {
    //     //run by the program, note i've defined it to use preview text...
    //     const outer = el.createDiv({ cls: "obr-sugggester-container" });
    //     outer.createDiv({ cls: "obr-shortcode" }).setText(this.previewText);
    // }
}
