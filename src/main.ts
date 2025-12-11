import { Plugin, Notice, PluginSettingTab, Setting, App } from "obsidian";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Plugin settings interface
 */
interface TaskCheckerSettings {
    excludedFolders: string[];
    excludedFiles: string[];
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: TaskCheckerSettings = {
    excludedFolders: [
        "G:/Data/Dropbox/ToDo/personal/checklists",
        "G:/Data/Dropbox/ToDo/personal/tickler",
        "G:/Data/Dropbox/ToDo/personal/Utility",
        "G:/Data/Dropbox/ToDo/personal/someday",
        "G:/Data/Dropbox/ToDo/personal/projects",
        "G:/Data/Dropbox/ToDo/personal/software",
        "G:/Data/Dropbox/ToDo/personal/roles",
        "G:/Data/Dropbox/ToDo/personal/daily"
    ],
    excludedFiles: [
        "G:/Data/Dropbox/ToDo/personal/software/Git/weekly-branch-names.md",
        "G:/Data/Dropbox/ToDo/personal/CLAUDE.md",
        "G:/Data/Dropbox/ToDo/personal/software/linux/Not Next Bash Example.md"
    ]
};

/**
 * Obsidian plugin that scans markdown files for incomplete tasks (marked with "- [ ]")
 * and provides commands to list files containing tasks or show a task count.
 */
export default class MyTaskChecker extends Plugin {
    settings: TaskCheckerSettings;

    /**
     * Loads settings from storage or uses defaults.
     */
    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData || {});
    }

    /**
     * Saves settings to storage.
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Initializes the plugin when Obsidian loads it.
     * Sets up the ribbon icon and command palette commands.
     */
    async onload() {
        console.log("Loading Task Checker plugin");

        // Load settings
        await this.loadSettings();

        // Add settings tab
        const settingsTab = new TaskCheckerSettingTab(this.app, this);
        this.addSettingTab(settingsTab);
        console.log("Task Checker: Settings tab registered");

        // Add a ribbon icon that triggers the task listing when clicked
        this.addRibbonIcon("check-circle", "List files with tasks", () => {
            this.listFilesWithTasks();
        });

        // Register command to list all files containing tasks
        this.addCommand({
            id: "list-files-with-tasks",
            name: "List Files with Tasks",
            callback: () => this.listFilesWithTasks(),
        });

        // Register command to display the count of files with tasks
        this.addCommand({
            id: "show-task-count",
            name: "Show Task Count",
            callback: () => this.showTaskCount(),
        });
    }

    /**
     * Cleanup when the plugin is unloaded.
     */
    onunload() {
        console.log("Unloading Task Checker plugin");
    }

    /**
     * Converts a file path to an Obsidian-style link.
     * 
     * @param filePath - The absolute file path
     * @param vaultPath - The vault root path
     * @returns Obsidian link in the format [[path/to/file]]
     */
    private pathToObsidianLink(filePath: string, vaultPath: string): string {
        // Get relative path from vault root
        const relativePath = path.relative(vaultPath, filePath);
        // Normalize path separators to forward slashes
        const normalizedPath = relativePath.replace(/\\/g, "/");
        // Remove .md extension if present
        const linkPath = normalizedPath.replace(/\.md$/i, "");
        // Return as Obsidian link
        return `[[${linkPath}]]`;
    }

    /**
     * Scans the vault for files containing incomplete tasks and writes the results
     * to a markdown file in the vault root with today's date.
     * 
     * The output file is named "todo-files-YYYY-MM-DD.md" and contains Obsidian-style links,
     * one per line, in the format [[path/to/file]].
     */
    async listFilesWithTasks() {
        const vaultPath = this.app.vault.adapter.basePath;
        const filesWithTasks = await this.getFilesWithTasks(vaultPath);

        if (filesWithTasks.length === 0) {
            new Notice("No files with tasks found.");
        } else {
            // Convert file paths to Obsidian-style links
            const obsidianLinks = filesWithTasks.map(filePath => 
                this.pathToObsidianLink(filePath, vaultPath)
            );
            // Join links with newlines to create a simple list format
            const fileList = obsidianLinks.join("\n");
            // Generate filename with current date in YYYY-MM-DD format
            const currentDate = new Date();
            const localDate = currentDate.toLocaleDateString("en-CA");
            const fileName = `todo-files-${localDate}.md`;
            // Write the list to a markdown file in the vault root
            await this.app.vault.adapter.write(fileName, fileList);
            new Notice(`Files with tasks have been written to ${fileName}`);
        }
    }

    /**
     * Displays a notification showing the total count of files that contain incomplete tasks.
     */
    async showTaskCount() {
        const vaultPath = this.app.vault.adapter.basePath;
        const filesWithTasks = await this.getFilesWithTasks(vaultPath);
        const taskCount = filesWithTasks.length;
        new Notice(`Total number of files with tasks: ${taskCount}`);
    }

    /**
     * Recursively scans a directory tree for markdown files containing incomplete tasks.
     * 
     * A task is considered incomplete if it contains the pattern "- [ ]" (unchecked checkbox).
     * Files in excluded folders and specific excluded files are skipped.
     * 
     * @param dir - The root directory path to start scanning from
     * @returns Promise resolving to an array of file paths that contain incomplete tasks
     */
    async getFilesWithTasks(dir: string): Promise<string[]> {
        let filesWithTasks: string[] = [];

        /**
         * Recursively reads a directory and checks markdown files for incomplete tasks.
         * @param dirPath - The directory path to scan
         */
        const readDir = async (dirPath: string) => {
            // Normalize Windows backslashes to forward slashes for consistent path comparison
            const normalizedDir = dirPath.replace(/\\/g, "/");
            
            // Skip this directory and all its contents if it's in the excluded folders list
            if (this.settings.excludedFolders.some((excluded) => normalizedDir.startsWith(excluded))) {
                return;
            }

            const files = await fs.readdir(dirPath);
            for (const file of files) {
                // Normalize path separators for consistent comparison with excluded files
                const filePath = path.join(dirPath, file).replace(/\\/g, "/");
                const stat = await fs.lstat(filePath);

                // Skip files that are explicitly excluded
                if (this.settings.excludedFiles.includes(filePath)) {
                    continue;
                }

                if (stat.isDirectory()) {
                    // Recursively scan subdirectories
                    await readDir(filePath);
                } else if (file.endsWith(".md")) {
                    // Only process markdown files
                    const content = await fs.readFile(filePath, "utf8");
                    // Check if file contains at least one incomplete task (unchecked checkbox)
                    if (content.includes("- [ ]")) {
                        filesWithTasks.push(filePath);
                    }
                }
            }
        };

        await readDir(dir);
        return filesWithTasks;
    }
}

/**
 * Settings tab for the Task Checker plugin.
 * Allows users to configure excluded folders and files.
 */
class TaskCheckerSettingTab extends PluginSettingTab {
    plugin: MyTaskChecker;

    constructor(app: App, plugin: MyTaskChecker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Task Checker Settings" });

        // Excluded Folders section
        containerEl.createEl("h3", { text: "Excluded Folders" });
        containerEl.createEl("p", {
            text: "Folders that should be excluded from task scanning. These directories are skipped entirely during recursive traversal.",
            cls: "setting-item-description"
        });

        const excludedFoldersContainer = containerEl.createDiv("excluded-folders-container");
        
        // Display existing excluded folders
        this.plugin.settings.excludedFolders.forEach((folder, index) => {
            const folderSetting = new Setting(excludedFoldersContainer)
                .addText(text => {
                    text.setValue(folder)
                        .setPlaceholder("Enter folder path")
                        .onChange(async (value) => {
                            this.plugin.settings.excludedFolders[index] = value;
                            await this.plugin.saveSettings();
                        });
                })
                .addExtraButton(button => {
                    button.setIcon("trash")
                        .setTooltip("Remove this folder")
                        .onClick(async () => {
                            this.plugin.settings.excludedFolders.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.display(); // Refresh the settings tab
                        });
                });
        });

        // Add new folder button
        new Setting(excludedFoldersContainer)
            .addButton(button => {
                button.setButtonText("Add Folder")
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.excludedFolders.push("");
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings tab
                    });
            });

        // Excluded Files section
        containerEl.createEl("h3", { text: "Excluded Files" });
        containerEl.createEl("p", {
            text: "Individual files that should be excluded from task scanning. These files are skipped even if they contain task markers.",
            cls: "setting-item-description"
        });

        const excludedFilesContainer = containerEl.createDiv("excluded-files-container");
        
        // Display existing excluded files
        this.plugin.settings.excludedFiles.forEach((file, index) => {
            const fileSetting = new Setting(excludedFilesContainer)
                .addText(text => {
                    text.setValue(file)
                        .setPlaceholder("Enter file path")
                        .onChange(async (value) => {
                            this.plugin.settings.excludedFiles[index] = value;
                            await this.plugin.saveSettings();
                        });
                })
                .addExtraButton(button => {
                    button.setIcon("trash")
                        .setTooltip("Remove this file")
                        .onClick(async () => {
                            this.plugin.settings.excludedFiles.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.display(); // Refresh the settings tab
                        });
                });
        });

        // Add new file button
        new Setting(excludedFilesContainer)
            .addButton(button => {
                button.setButtonText("Add File")
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.excludedFiles.push("");
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings tab
                    });
            });
    }
}
