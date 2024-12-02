import { Plugin } from "obsidian";
import { GospelNotebookSettings, DEFAULT_SETTINGS } from "./utils/settings";
import { VerseSuggester } from "./suggesters/VerseSuggester";
import { GospelNotebookSettingsTab } from "./ui/GospelNotebookSettingsTab";
import { GenConSuggester } from "./suggesters/GenConSuggester";

// TODO Refactor CSS changes to allow for original format of obsidian plugin rather than custom style implemented in this css (option in settings)
// // This is done by changing the callout data to "scripture" rather than "mormon"
// TODO refactor API and other data access classes into a single data access class if possible, simplify all web api calls to one class
// TODO fix General Conference links breaking by searching only for 'h1' headings without caring about id of html elements
// TODO fix settings to allow for invisible links, like his implementation of replacing church links with Markdown. Allow for both options to be enabled depending on settings.
// TODO figure out how he's doing book abbreviations, possibly refactor if less efficient/readable, otherwise scrap your method and try his way
// TODO remove requirement to end scripture with ';'
export default class GospelNotebookPlugin extends Plugin {
    settings: GospelNotebookSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GospelNotebookSettingsTab(this.app, this));
        this.registerEditorSuggest(new VerseSuggester(this));
        this.registerEditorSuggest(new GenConSuggester(this));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
