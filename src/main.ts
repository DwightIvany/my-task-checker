import { Plugin, Notice } from "obsidian";
import * as fs from "fs/promises";
import * as path from "path";

// Define excluded folders and files as constants
const EXCLUDED_FOLDERS = [
    "G:/Data/Dropbox/ToDo/personal/checklists",
    "G:/Data/Dropbox/ToDo/personal/tickler",
    "G:/Data/Dropbox/ToDo/personal/Utility",
    "G:/Data/Dropbox/ToDo/personal/someday",
    "G:/Data/Dropbox/ToDo/personal/projects-and-roles",
    "G:/Data/Dropbox/ToDo/personal/daily"
];

const EXCLUDED_FILES = [
    "G:/Data/Dropbox/ToDo/personal/software/Git/weekly-branch-names.md",
    "G:/Data/Dropbox/ToDo/personal/software/linux/Not Next Bash Example.md"
];

export default class MyTaskChecker extends Plugin {
    async onload() {
        console.log("Loading Task Checker plugin");

        this.addRibbonIcon("check-circle", "List files with tasks", () => {
            this.listFilesWithTasks();
        });

        this.addCommand({
            id: "list-files-with-tasks",
            name: "List Files with Tasks",
            callback: () => this.listFilesWithTasks(),
        });

        this.addCommand({
            id: "show-task-count",
            name: "Show Task Count",
            callback: () => this.showTaskCount(),
        });
    }

    onunload() {
        console.log("Unloading Task Checker plugin");
    }

    async listFilesWithTasks() {
        const vaultPath = this.app.vault.adapter.basePath;
        const filesWithTasks = await this.getFilesWithTasks(vaultPath);

        if (filesWithTasks.length === 0) {
            new Notice("No files with tasks found.");
        } else {
            const fileList = filesWithTasks.join("\n");
            const currentDate = new Date();
            const localDate = currentDate.toLocaleDateString("en-CA");
            const fileName = `todo-files-${localDate}.md`;
            await this.app.vault.adapter.write(fileName, fileList);
            new Notice(`Files with tasks have been written to ${fileName}`);
        }
    }

    async showTaskCount() {
        const vaultPath = this.app.vault.adapter.basePath;
        const filesWithTasks = await this.getFilesWithTasks(vaultPath);
        const taskCount = filesWithTasks.length;
        new Notice(`Total number of files with tasks: ${taskCount}`);
    }

    async getFilesWithTasks(dir: string): Promise<string[]> {
        let filesWithTasks: string[] = [];

        const readDir = async (dirPath: string) => {
            const normalizedDir = dirPath.replace(/\\/g, "/"); // Normalize paths
            // Skip excluded folders
            if (EXCLUDED_FOLDERS.some((excluded) => normalizedDir.startsWith(excluded))) {
                return;
            }

            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file).replace(/\\/g, "/"); // Normalize paths for comparison
                const stat = await fs.lstat(filePath);

                // Skip excluded files
                if (EXCLUDED_FILES.includes(filePath)) {
                    continue;
                }

                if (stat.isDirectory()) {
                    await readDir(filePath);
                } else if (file.endsWith(".md")) {
                    const content = await fs.readFile(filePath, "utf8");
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
