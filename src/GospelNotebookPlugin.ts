import { Plugin } from "obsidian";
import { GospelNotebookSettings, DEFAULT_SETTINGS } from "./utils/settings";
import { VerseSuggester } from "./suggesters/VerseSuggester";
import { GospelNotebookSettingsTab } from "./ui/GospelNotebookSettingsTab";
import { GenConSuggester } from "./suggesters/GenConSuggester";

// TODO fix General Conference links breaking by searching only for 'h1' headings without caring about id of html elements
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
