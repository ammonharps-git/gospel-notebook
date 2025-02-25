import { Plugin } from "obsidian";
import { GospelNotebookSettings, DEFAULT_SETTINGS } from "./utils/settings";
import { VerseSuggester } from "./suggesters/VerseSuggester";
import { GospelNotebookSettingsTab } from "./ui/GospelNotebookSettingsTab";
import { OnlineResourceSuggester } from "./suggesters/OnlineResourceSuggester";

export default class GospelNotebookPlugin extends Plugin {
    settings: GospelNotebookSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GospelNotebookSettingsTab(this.app, this));
        this.registerEditorSuggest(new VerseSuggester(this));
        this.registerEditorSuggest(new OnlineResourceSuggester(this));
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
