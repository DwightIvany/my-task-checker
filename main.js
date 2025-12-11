var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MyTaskChecker
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var fs = __toESM(require("fs/promises"));
var path = __toESM(require("path"));
var DEFAULT_SETTINGS = {
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
var MyTaskChecker = class extends import_obsidian.Plugin {
  settings;
  /**
   * Loads settings from storage or uses defaults.
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
    await this.loadSettings();
    this.addSettingTab(new TaskCheckerSettingTab(this.app, this));
    this.addRibbonIcon("check-circle", "List files with tasks", () => {
      this.listFilesWithTasks();
    });
    this.addCommand({
      id: "list-files-with-tasks",
      name: "List Files with Tasks",
      callback: () => this.listFilesWithTasks()
    });
    this.addCommand({
      id: "show-task-count",
      name: "Show Task Count",
      callback: () => this.showTaskCount()
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
  pathToObsidianLink(filePath, vaultPath) {
    const relativePath = path.relative(vaultPath, filePath);
    const normalizedPath = relativePath.replace(/\\/g, "/");
    const linkPath = normalizedPath.replace(/\.md$/i, "");
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
      new import_obsidian.Notice("No files with tasks found.");
    } else {
      const obsidianLinks = filesWithTasks.map(
        (filePath) => this.pathToObsidianLink(filePath, vaultPath)
      );
      const fileList = obsidianLinks.join("\n");
      const currentDate = /* @__PURE__ */ new Date();
      const localDate = currentDate.toLocaleDateString("en-CA");
      const fileName = `todo-files-${localDate}.md`;
      await this.app.vault.adapter.write(fileName, fileList);
      new import_obsidian.Notice(`Files with tasks have been written to ${fileName}`);
    }
  }
  /**
   * Displays a notification showing the total count of files that contain incomplete tasks.
   */
  async showTaskCount() {
    const vaultPath = this.app.vault.adapter.basePath;
    const filesWithTasks = await this.getFilesWithTasks(vaultPath);
    const taskCount = filesWithTasks.length;
    new import_obsidian.Notice(`Total number of files with tasks: ${taskCount}`);
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
  async getFilesWithTasks(dir) {
    let filesWithTasks = [];
    const readDir = async (dirPath) => {
      const normalizedDir = dirPath.replace(/\\/g, "/");
      if (this.settings.excludedFolders.some((excluded) => normalizedDir.startsWith(excluded))) {
        return;
      }
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file).replace(/\\/g, "/");
        const stat = await fs.lstat(filePath);
        if (this.settings.excludedFiles.includes(filePath)) {
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
};
var TaskCheckerSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Task Checker Settings" });
    containerEl.createEl("h3", { text: "Excluded Folders" });
    containerEl.createEl("p", {
      text: "Folders that should be excluded from task scanning. These directories are skipped entirely during recursive traversal.",
      cls: "setting-item-description"
    });
    const excludedFoldersContainer = containerEl.createDiv("excluded-folders-container");
    this.plugin.settings.excludedFolders.forEach((folder, index) => {
      const folderSetting = new import_obsidian.Setting(excludedFoldersContainer).addText((text) => {
        text.setValue(folder).setPlaceholder("Enter folder path").onChange(async (value) => {
          this.plugin.settings.excludedFolders[index] = value;
          await this.plugin.saveSettings();
        });
      }).addExtraButton((button) => {
        button.setIcon("trash").setTooltip("Remove this folder").onClick(async () => {
          this.plugin.settings.excludedFolders.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
    });
    new import_obsidian.Setting(excludedFoldersContainer).addButton((button) => {
      button.setButtonText("Add Folder").setCta().onClick(async () => {
        this.plugin.settings.excludedFolders.push("");
        await this.plugin.saveSettings();
        this.display();
      });
    });
    containerEl.createEl("h3", { text: "Excluded Files" });
    containerEl.createEl("p", {
      text: "Individual files that should be excluded from task scanning. These files are skipped even if they contain task markers.",
      cls: "setting-item-description"
    });
    const excludedFilesContainer = containerEl.createDiv("excluded-files-container");
    this.plugin.settings.excludedFiles.forEach((file, index) => {
      const fileSetting = new import_obsidian.Setting(excludedFilesContainer).addText((text) => {
        text.setValue(file).setPlaceholder("Enter file path").onChange(async (value) => {
          this.plugin.settings.excludedFiles[index] = value;
          await this.plugin.saveSettings();
        });
      }).addExtraButton((button) => {
        button.setIcon("trash").setTooltip("Remove this file").onClick(async () => {
          this.plugin.settings.excludedFiles.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
    });
    new import_obsidian.Setting(excludedFilesContainer).addButton((button) => {
      button.setButtonText("Add File").setCta().onClick(async () => {
        this.plugin.settings.excludedFiles.push("");
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }
};
