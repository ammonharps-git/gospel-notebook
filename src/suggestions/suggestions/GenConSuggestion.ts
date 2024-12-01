import { GenConTalkData } from "src/utils/types";
import { fetchGenConTalk } from "src/data_access/generalconference";
import { format, parse } from "date-fns";
import { LinkFormat } from "src/utils/settings";
import { Suggestion } from "./Suggestion";

export class GenConSuggestion extends Suggestion {
    public text: string;
    public previewText: string; //this is what's loaded by the preview thing.
    public data: GenConTalkData; //should this be an array of item? probably not.
    public date: string;

    constructor(
        public pluginName: string,
        public url: string,
        public linkType: LinkFormat
    ) {
        super();
    }

    private async getParagraphs(): Promise<GenConTalkData> {
        return await fetchGenConTalk(this.url, "GET");
    }

    private convertDate = (dateString: string): string => {
        // Parse the date string
        const parsedDate = parse(dateString, "MM-yyyy", new Date());
        // Format the parsed date to the desired format
        return format(parsedDate, "MMMM yyyy");
    };

    public getReplacement(): string {
        //      let linktype = this.linkType;
        this.text = this.toText();
        let headerFront = `>[!gencon] [${this.data.title}](${this.url})`;
        const attribution = `>> [!genconcitation]\n>> ${this.data.author[0]}\n>> ${this.data.author[1]}\n>>${this.date}`;
        return headerFront + "\n" + this.text + attribution + "\n";
    }

    private toPreviewText(talkData: GenConTalkData): string {
        // this.previewText = talkData.title + "\n\n" +
        //      talkData.content[0]

        let text = `${talkData.title} ${talkData.author[0]}`;
        return text;
    }

    private toText(): string {
        let outstring: string = "";

        this.data.content.forEach((element) => {
            outstring = outstring + `> ${element} \n>\n `;
        });
        return outstring;
    }

    public async loadTalk(): Promise<void> {
        this.data = await this.getParagraphs();
        this.previewText = this.toPreviewText(this.data);
        this.date = this.convertDate(`${this.data.month}-${this.data.year}`);
    }

    public render(el: HTMLElement): void {
        //run by the program, note i've defined it to use preview text...
        const outer = el.createDiv({ cls: "obr-sugggester-container" });
        outer.createDiv({ cls: "obr-shortcode" }).setText(this.previewText);
    }
}
