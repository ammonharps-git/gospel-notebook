import { Plugin } from "obsidian";
import { GospelNotebookSettings, DEFAULT_SETTINGS } from "./settings";
import { VerseSuggester } from "./suggestions/suggesters/VerseSuggester";
import { BookOfMormonSettingTab } from "./ui/BookOfMormonSettingTab";
import { GenConSuggester } from "./suggestions/suggesters/GenConSuggester";

export default class GospelNotebookPlugin extends Plugin {
    settings: GospelNotebookSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new BookOfMormonSettingTab(this.app, this));
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
