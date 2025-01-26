import {
    CalloutStyle,
    LinkFormat as LinkFormat,
    LinkType,
} from "src/utils/settings";
import { AvailableLanguage } from "../utils/lang";
import { BookData, ScriptureData, Verse } from "../utils/types";
import { book_data } from "src/data_access/config";
import { Suggestion } from "./Suggestion";
import { VerseDAO } from "src/data_access/VerseDAO";

// TODO clean up this class by removing unneeded variables and examine how data is being stored and handled
// TODO Consolodate data access to the plugin level using DAO for improved layered architecture that is only dependent on abstractions rather than implementations
// TODO maybe refactor all data access to the Suggester layer? That would decrease dependencies and more closely follow Single Responsibility Principle

export class VerseSuggestion extends Suggestion {
    public chapter_data: ScriptureData[];
    private bookdata: BookData = book_data;
    private book_title_in_language: string;
    private url: string;
    private dao: VerseDAO;

    constructor(
        public calloutStyle: CalloutStyle,
        public book: string,
        public chapterNum: number,
        public verseNums: number[], // FIXME avoid primative obsession
        public lang: AvailableLanguage,
        public linkType: LinkType,
        public linkFormat: LinkFormat,
        public createInvisibleLink: boolean
    ) {
        super();
        this.dao = new VerseDAO();
    }

    public getReplacement(): string {
        // let linkFormat = this.linkFormat;
        let range = this.formatNumberList(this.verseNums);

        // if (this.createChapterLink) {
        //     if (linkFormat == LinkFormat.Wiki) {
        //         // Wiki style link to chapter document and outside URL
        //         const headerFront = `[[${this.book_title_in_language}|${this.book_title_in_language}:${range}]]`;
        //         const head = `> [!${this.calloutStyle}] ${headerFront} \n [churchofjesuschrist.org](${this.url})`;
        //         return head + "\n" + this.text + "\n";
        //     } else if (linkFormat == LinkFormat.Markdown) {
        //         // Markdown style link with spaces encoded as %20
        //         const encodedBookChapter = encodeURIComponent(
        //             this.book_title_in_language
        //         );
        //         const headerFront = `[${this.book_title_in_language}:${range}](${encodedBookChapter})`;
        //         const head = `> [!${this.calloutStyle}] ${headerFront} \n [churchofjesuschrist.org](${this.url})`;
        //         return head + "\n" + this.text + "\n";
        //     }
        // }

        let header: string;
        if (this.linkType == LinkType.ChurchWebsite) {
            const invisibleLink = this.createInvisibleLink
                ? ""
                : this.linkFormat == LinkFormat.Markdown
                ? `[[${this.book_title_in_language}|]]`
                : `[](${encodeURIComponent(this.book_title_in_language)})`;

            header = `[${this.book_title_in_language}:${range}](${this.url}) ${invisibleLink}`;
        } else if (this.linkType == LinkType.InternalMarkdown) {
            header = `[[${this.book_title_in_language}|${this.book_title_in_language}:${range}]]`;
        } else {
            throw new Error("Invalid LinkType: " + this.linkType);
        }
        return `> [!${this.calloutStyle}] ${header}\n${this.content}\n`;

        // Normal function
        // const headerFront = `${this.book_title_in_language}:`;
        // const head = `> [!${this.calloutStyle}] [${headerFront}${range}](${this.url})`;
        // return head + "\n" + this.text + "\n";
    }

    private getUrl(
        volume: string,
        book: string,
        chapterNum: string | number,
        language: string,
        verseNums: number[]
    ): string {
        return `https://www.churchofjesuschrist.org/study/scriptures/${volume}/${book}/${chapterNum}?lang=${language}&id=p${verseNums.join(
            ","
        )}#p${Math.min(...verseNums)}`;
    }

    private convertToVerses(
        chapterData: ScriptureData[],
        verseNums: number[],
        volume: string,
        fullBookName: string,
        shortenedBookName: string,
        chapterNum: number
    ): Verse[] {
        let verses: Verse[] = [];

        for (const index in verseNums) {
            let verse_text = chapterData[0].verses.get(`p${verseNums[index]}`);
            // Attributes assumed to be in Verse class
            let verse: Verse = {
                volume_title: "",
                volume_title_short: volume,
                book_title: fullBookName,
                book_title_short: shortenedBookName,
                chapter_number: chapterNum,
                verse_number: verseNums[index],
                verse_title: "", // Set as needed
                scripture_text: verse_text
                    ? verse_text.trim().replace(/^\d{1,3}\s*/, "")
                    : "", // Handle possible undefined value
            };
            verses.push(verse);
        }
        return verses;
    }

    private toText(verses: Verse[]): string {
        const referenceText: String[] = [];
        let lastVerseNum = 0;
        for (let i = 0; i < verses.length; i++) {
            let verseText = "";
            const verseNum = verses[i].verse_number;
            const scriptureText = verses[i].scripture_text;
            if (i == 0) {
                verseText += `<ol start="${verseNum}">`;
            } else if (lastVerseNum + 1 != verseNum) {
                verseText += `</ol><ol start="${verseNum}">`;
            }
            lastVerseNum = verseNum;
            verseText += `<li>${scriptureText}</li>`;
            if (i == verses.length - 1) {
                verseText += "</ol>";
            }
            referenceText.push(verseText);
        }
        return "> " + referenceText.join("");
    }

    private toPreviewText(verses: Verse[]): string {
        return verses
            .map(
                ({ verse_number, scripture_text }) =>
                    `${verse_number}. ${scripture_text}`
            )
            .join("\n");
    }

    private getShortenedName(bookTitle: string) {
        for (const key in this.bookdata) {
            if (this.bookdata[key].names.includes(bookTitle)) {
                let volume = this.bookdata[key].volume;
                return [key, volume];
            }
        }
        return [];
    }

    public async loadVerse(): Promise<void> {
        this.chapter_data = [];
        const [book_title_short, volume_title_short] = this.getShortenedName(
            this.book
        );
        this.url = this.getUrl(
            volume_title_short,
            book_title_short,
            this.chapterNum,
            this.lang,
            this.verseNums
        );
        let scriptdata: ScriptureData = await this.dao.fetchScripture(
            this.url,
            "GET"
        );
        this.book_title_in_language = scriptdata.in_language_book;
        this.chapter_data.push(scriptdata);
        const verses: Verse[] = this.convertToVerses(
            this.chapter_data,
            this.verseNums,
            volume_title_short,
            this.book,
            book_title_short,
            this.chapterNum
        );
        this.content = this.toText(verses);
        this.preview = this.toPreviewText(verses);
    }

    public formatNumberList(numbers: number[]): string {
        if (numbers.length === 0) return "";

        // Ensure the numbers are sorted
        numbers.sort((a, b) => a - b);

        const result: string[] = [];
        let rangeStart = numbers[0];
        let rangeEnd = numbers[0];

        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] === rangeEnd + 1) {
                // Continue the range
                rangeEnd = numbers[i];
            } else {
                // End the current range and start a new one
                if (rangeStart === rangeEnd) {
                    result.push(rangeStart.toString());
                } else {
                    result.push(`${rangeStart}-${rangeEnd}`);
                }
                rangeStart = numbers[i];
                rangeEnd = numbers[i];
            }
        }

        // Add the last range
        if (rangeStart === rangeEnd) {
            result.push(rangeStart.toString());
        } else {
            result.push(`${rangeStart}-${rangeEnd}`);
        }

        return result.join(", ");
    }
}
