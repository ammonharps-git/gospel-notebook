import { Plugin } from "obsidian";
import { BookOfMormonSettings, DEFAULT_SETTINGS } from "./settings";

import { Suggester } from './suggestion/suggester';
import { BookOfMormonSettingTab } from './ui/BookOfMormonSettingTab';

export default class BookOfMormonPlugin extends Plugin {
    settings: BookOfMormonSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new BookOfMormonSettingTab(this.app, this));
        this.registerEditorSuggest(new Suggester(this));
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
