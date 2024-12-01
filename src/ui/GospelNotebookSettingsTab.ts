import {
    App,
    ButtonComponent,
    DropdownComponent,
    Notice,
    PluginSettingTab,
    Setting,
    ToggleComponent,
} from "obsidian";
import GospelNotebookPlugin from "../GospelNotebookPlugin";
import {
    AVAILABLE_LANGUAGES,
    LANGUAGE_MAPPING,
    AvailableLanguage,
} from "../utils/lang";
import {
    CalloutCollapseType as VerseCollapseType,
    CalloutStyle as VerseStyle,
    LinkFormat,
    LinkType,
} from "src/utils/settings";

// TODO clean up settings and divide into three tabs: Scriptures, References, and General Conference

export class GospelNotebookSettingsTab extends PluginSettingTab {
    constructor(app: App, public plugin: GospelNotebookPlugin) {
        super(app, plugin);
    }

    setupLanguageOption(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Scripture language")
            .setDesc("Preferred scripture language")
            .addDropdown((dropdown) => {
                AVAILABLE_LANGUAGES.forEach((lang) => {
                    dropdown.addOption(lang, LANGUAGE_MAPPING[lang]);
                });

                dropdown
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value: AvailableLanguage) => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    });
            });
    }

    setVerseOptions(containerEl: HTMLElement) {
        // Verse Collapsability
        new Setting(containerEl)
            .setName("Verse Collapsability")
            .setDesc(
                "When inserting a scripture, this determines if the verse callout block will be expanded, collapsed, or non-collapsable by default."
            )
            .addDropdown((dropdown) => {
                dropdown.addOption(VerseCollapseType.Collapsed, "Collapsed");
                dropdown.addOption(VerseCollapseType.Expanded, "Expanded");
                dropdown.addOption(
                    VerseCollapseType.NonCollapsable,
                    "Non-Collapsable"
                );
                dropdown
                    .setValue(this.plugin.settings.verseCollapseType)
                    .onChange(async (value: VerseCollapseType) => {
                        this.plugin.settings.verseCollapseType = value;
                        await this.plugin.saveSettings();
                        new Notice("Verse Collapsability Updated");
                    });
            });
        // Verse Style
        new Setting(containerEl)
            .setName("Verse Style")
            .setDesc(
                "Choose between classic Obisidian or custom callout styles for inserted verses."
            )
            .addDropdown((dropdown) => {
                dropdown.addOption(VerseStyle.Classic, "Classic");
                dropdown.addOption(VerseStyle.Stylized, "Stylized");
                dropdown
                    .setValue(this.plugin.settings.verseStyle)
                    .onChange(async (value: VerseStyle) => {
                        this.plugin.settings.verseStyle = value;
                        await this.plugin.saveSettings();
                        new Notice("Verse Style Updated");
                    });
            });
        // Verse Trigger
        let initialValue = this.plugin.settings.verseTrigger;
        let textAreaValue: string = initialValue;
        let button: ButtonComponent;
        new Setting(containerEl)
            .setName("Verse Trigger")
            .setDesc(
                'The verse callout trigger is the character or string that preceeds a scripture reference in order for a scripture callout to be suggested to you. For example, if the callout trigger were "+" (the addition symbol), then a scripture callout would be suggested if you typed "+Matthew 5:48", "+1 Nephi 3:7", or "+" followed by any other scripture reference. Be careful to not include any unintentional leading or trailing spaces, as they will be counted as part of the trigger.'
            )
            .addTextArea((textArea) => {
                textArea.setValue(textAreaValue).onChange((value: string) => {
                    textAreaValue = value;
                    button.setDisabled(value === initialValue);
                });
            })
            .addButton((btn) => {
                button = btn;
                button
                    .setDisabled(true)
                    .setButtonText("Save")
                    .onClick(async () => {
                        this.plugin.settings.verseTrigger = textAreaValue;
                        await this.plugin.saveSettings();
                        new Notice("Verse Trigger Updated");
                        initialValue = textAreaValue;
                        button.setDisabled(true);
                    });
            });
        // Link type (Church Website vs internal Markdown)
        new Setting(containerEl)
            .setName("Link type")
            .setDesc(
                "Choose the type of link to create when inserting scriptures or references."
            )
            .addDropdown((dropdown) => {
                dropdown
                    // .addOption('default', 'Default')
                    .addOption(
                        LinkType.ChurchWebsite,
                        "Church Website (Wiki Link)"
                    )
                    .addOption(LinkType.InternalMarkdown, "Markdown Link")
                    .setValue(this.plugin.settings.linkType)
                    .onChange(async (value: LinkType) => {
                        this.plugin.settings.linkType = value;
                        invisibleMarkdownToggle.setDisabled(
                            this.plugin.settings.linkType ===
                                LinkType.InternalMarkdown
                        );
                        if (
                            this.plugin.settings.linkType ===
                            LinkType.InternalMarkdown
                        ) {
                            invisibleMarkdownToggle.setValue(false);
                        }
                        await this.plugin.saveSettings();
                        new Notice("Updated Verse Link Type");
                    });
            });
        // Invisible Markdown Link
        let invisibleMarkdownToggle: ToggleComponent;
        new Setting(containerEl)
            .setName("Insert Invisible Markdown Links")
            .setDesc(
                'Only available when "Link Type" is NOT set to Markdown. If this setting is on, whenever a scripture callout is inserted, an invisible link to a Markdown copy of the scripture is also inserted. The Markdown file is assumed to be named according to the chapter of the scripture reference (Ex: "1 Nephi 3:7" would create a link to "1 Nephi 3.md"). This is useful for visualizing your scripture cross-references within Obsidian Graph Views but still allows you to link the scriptures to the official Church website without the need to see two references.'
            )
            .addToggle((toggle) => {
                invisibleMarkdownToggle = toggle;
                invisibleMarkdownToggle
                    .setDisabled(
                        this.plugin.settings.linkFormat !== LinkFormat.Wiki
                    )
                    .setValue(this.plugin.settings.toggleInvisibleLinks)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.toggleInvisibleLinks = value;
                        await this.plugin.saveSettings();
                        new Notice(
                            "Updated Invisible Link Settings for Verses"
                        );
                    });
            });
    }

    setupLinkOption(containerEl: HTMLElement) {
        // Adding additional settings which can automatically create back links so you can see which of your documents
        // and how many reference which chapters in the scriptures.
        new Setting(containerEl)
            .setName("Chapter linking")
            .setDesc(
                "When adding a scripture reference, create a link to an document named <Book> <Chapter>."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.createChapterLink)
                    .onChange(async (value) => {
                        this.plugin.settings.createChapterLink = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h1", { text: "Gospel Notebook Settings" });
        this.setupLanguageOption(containerEl);
        containerEl.createEl("h2", { text: "Verse Suggestion Settings" });
        this.setVerseOptions(containerEl);
        this.setupLinkOption(containerEl);

        containerEl.createEl("h2", { text: "About" });
        containerEl.createSpan({}, (span) => {
            span.innerHTML = `<a href="https://github.com/ammonharps-git/gospel-notebook">Click Here</a> to view the Github documentation for this plugin.`;
        });
    }
}
