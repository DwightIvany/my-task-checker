import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    SettingDefinitionItem,
    TFile,
    normalizePath,
} from "obsidian";

interface TaskCheckerSettings {
    excludedFolders: string[];
    excludedFiles: string[];
}

const DEFAULT_SETTINGS: TaskCheckerSettings = {
    excludedFolders: [],
    excludedFiles: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Turns a stored exclusion into a vault-relative path.
 * Older settings used absolute filesystem paths; those are mapped onto
 * a vault file or folder when a matching suffix exists.
 */
function toVaultRelativePath(stored: string, knownPaths: string[]): string {
    const normalized = normalizePath(stored.replace(/\\/g, "/")).replace(/\/$/, "");
    if (!normalized) {
        return "";
    }
    if (knownPaths.includes(normalized)) {
        return normalized;
    }

    const parts = normalized.split("/").filter((part) => part.length > 0);
    for (let i = 0; i < parts.length; i++) {
        const candidate = parts.slice(i).join("/");
        if (knownPaths.includes(candidate)) {
            return candidate;
        }
    }

    return normalized;
}

function parseSettings(data: unknown, knownPaths: string[]): TaskCheckerSettings {
    const record = isRecord(data) ? data : {};
    const folders = isStringArray(record.excludedFolders) ? record.excludedFolders : [];
    const files = isStringArray(record.excludedFiles) ? record.excludedFiles : [];

    return {
        excludedFolders: folders
            .map((folder) => toVaultRelativePath(folder, knownPaths))
            .filter((folder) => folder.length > 0),
        excludedFiles: files
            .map((file) => toVaultRelativePath(file, knownPaths))
            .filter((file) => file.length > 0),
    };
}

function fileToWikiLink(file: TFile): string {
    const linkPath = file.path.replace(/\.md$/i, "");
    return `[[${linkPath}]]`;
}

function isExcludedFolder(filePath: string, excludedFolders: string[]): boolean {
    return excludedFolders.some((folder) => {
        if (!folder) {
            return false;
        }
        return filePath === folder || filePath.startsWith(`${folder}/`);
    });
}

/**
 * Scans the vault for notes with incomplete tasks (`- [ ]`) and can write
 * a dated list of wikilinks, or report how many such notes exist.
 */
export default class MyTaskChecker extends Plugin {
    settings: TaskCheckerSettings = { ...DEFAULT_SETTINGS };

    async loadSettings() {
        const knownPaths = this.app.vault.getAllLoadedFiles().map((file) => file.path);
        const loadedData = await this.loadData() as unknown;
        this.settings = parseSettings(loadedData, knownPaths);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        try {
            await this.loadSettings();
        } catch (error: unknown) {
            console.error("Task Checker: Error loading settings, using defaults", error);
            this.settings = { ...DEFAULT_SETTINGS };
        }

        this.addSettingTab(new TaskCheckerSettingTab(this.app, this));

        this.addRibbonIcon("check-circle", "List files with tasks", () => {
            this.run(() => this.listFilesWithTasks(), "Could not write the list of files with tasks.");
        });

        this.addCommand({
            id: "list-files-with-tasks",
            name: "List files with tasks",
            callback: () => {
                this.run(() => this.listFilesWithTasks(), "Could not write the list of files with tasks.");
            },
        });

        this.addCommand({
            id: "show-task-count",
            name: "Show task count",
            callback: () => {
                this.run(() => this.showTaskCount(), "Could not count files with tasks.");
            },
        });
    }

    /** Runs an async command from a void-returning callback, reporting failures. */
    private run(task: () => Promise<void>, failureMessage: string): void {
        task().catch((error: unknown) => {
            console.error(`Task Checker: ${failureMessage}`, error);
            new Notice(failureMessage);
        });
    }

    async listFilesWithTasks() {
        const filesWithTasks = await this.getFilesWithTasks();

        if (filesWithTasks.length === 0) {
            new Notice("No files with tasks found.");
            return;
        }

        const fileList = filesWithTasks.map(fileToWikiLink).join("\n");
        const localDate = new Date().toLocaleDateString("en-CA");
        const fileName = `todo-files-${localDate}.md`;
        const existing = this.app.vault.getAbstractFileByPath(fileName);

        if (existing instanceof TFile) {
            await this.app.vault.modify(existing, fileList);
        } else {
            await this.app.vault.create(fileName, fileList);
        }

        new Notice(`Files with tasks have been written to ${fileName}`);
    }

    async showTaskCount() {
        const filesWithTasks = await this.getFilesWithTasks();
        new Notice(`Total number of files with tasks: ${filesWithTasks.length}`);
    }

    async getFilesWithTasks(): Promise<TFile[]> {
        const filesWithTasks: TFile[] = [];
        const markdownFiles = this.app.vault.getMarkdownFiles();

        for (const file of markdownFiles) {
            if (isExcludedFolder(file.path, this.settings.excludedFolders)) {
                continue;
            }
            if (this.settings.excludedFiles.includes(file.path)) {
                continue;
            }

            try {
                const content = await this.app.vault.cachedRead(file);
                if (content.includes("- [ ]")) {
                    filesWithTasks.push(file);
                }
            } catch (error: unknown) {
                console.error(`Task Checker: Unable to read ${file.path}`, error);
            }
        }

        return filesWithTasks;
    }
}

class TaskCheckerSettingTab extends PluginSettingTab {
    plugin: MyTaskChecker;

    constructor(app: App, plugin: MyTaskChecker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getControlValue(key: string): unknown {
        const folderMatch = /^excludedFolders\.(\d+)$/.exec(key);
        if (folderMatch) {
            return this.plugin.settings.excludedFolders[Number(folderMatch[1])] ?? "";
        }

        const fileMatch = /^excludedFiles\.(\d+)$/.exec(key);
        if (fileMatch) {
            return this.plugin.settings.excludedFiles[Number(fileMatch[1])] ?? "";
        }

        return super.getControlValue(key);
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        if (typeof value !== "string") {
            return;
        }

        const folderMatch = /^excludedFolders\.(\d+)$/.exec(key);
        if (folderMatch) {
            this.plugin.settings.excludedFolders[Number(folderMatch[1])] = value;
            await this.plugin.saveSettings();
            return;
        }

        const fileMatch = /^excludedFiles\.(\d+)$/.exec(key);
        if (fileMatch) {
            this.plugin.settings.excludedFiles[Number(fileMatch[1])] = value;
            await this.plugin.saveSettings();
        }
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        const folders = this.plugin.settings.excludedFolders;
        const files = this.plugin.settings.excludedFiles;

        return [
            {
                type: "list" as const,
                heading: "Excluded folders",
                emptyState: "No folders excluded.",
                addItem: {
                    name: "Add folder",
                    action: () => {
                        folders.push("");
                        this.persist(true);
                    },
                },
                onReorder: (oldIndex: number, newIndex: number) => {
                    const [moved] = folders.splice(oldIndex, 1);
                    folders.splice(newIndex, 0, moved);
                    this.persist(false);
                },
                onDelete: (idx: number) => {
                    folders.splice(idx, 1);
                    this.persist(true);
                },
                items: folders.map((_folder, index) => ({
                    name: "Folder",
                    searchable: false,
                    control: {
                        type: "folder" as const,
                        key: `excludedFolders.${index}`,
                        includeRoot: false,
                        placeholder: "Select a folder",
                    },
                })),
            },
            {
                type: "list" as const,
                heading: "Excluded files",
                emptyState: "No files excluded.",
                addItem: {
                    name: "Add file",
                    action: () => {
                        files.push("");
                        this.persist(true);
                    },
                },
                onReorder: (oldIndex: number, newIndex: number) => {
                    const [moved] = files.splice(oldIndex, 1);
                    files.splice(newIndex, 0, moved);
                    this.persist(false);
                },
                onDelete: (idx: number) => {
                    files.splice(idx, 1);
                    this.persist(true);
                },
                items: files.map((_file, index) => ({
                    name: "File",
                    searchable: false,
                    control: {
                        type: "file" as const,
                        key: `excludedFiles.${index}`,
                        placeholder: "Select a file",
                        filter: (file: TFile) => file.extension === "md",
                    },
                })),
            },
        ];
    }

    /**
     * Saves from a void-returning list callback. Obsidian does not await these,
     * so the rejection has to be handled here.
     */
    private persist(rebuild: boolean): void {
        this.plugin
            .saveSettings()
            .then(() => {
                if (rebuild) {
                    this.update();
                }
            })
            .catch((error: unknown) => {
                console.error("Task Checker: Error saving settings", error);
                new Notice("Could not save settings.");
            });
    }
}
