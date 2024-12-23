var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/main.ts
__export(exports, {
  default: () => MyTaskChecker
});
var import_obsidian = __toModule(require("obsidian"));

// Define excluded folders as a constant
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

var MyTaskChecker = class extends import_obsidian.Plugin {
  async onload() {
    console.log("Loading Task Checker plugin");

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

  onunload() {
    console.log("Unloading Task Checker plugin");
  }

  async listFilesWithTasks() {
    const vaultPath = this.app.vault.adapter.basePath;
    const filesWithTasks = await this.getFilesWithTasks(vaultPath);

    if (filesWithTasks.length === 0) {
      new import_obsidian.Notice("No files with tasks found.");
    } else {
      const fileList = filesWithTasks.join("\n");
      const currentDate = new Date();
      const localDate = currentDate.toLocaleDateString("en-CA");
      const fileName = `todo-files-${localDate}.md`;
      await this.app.vault.adapter.write(fileName, fileList);
      new import_obsidian.Notice(`Files with tasks have been written to ${fileName}`);
    }
  }

  async showTaskCount() {
    const vaultPath = this.app.vault.adapter.basePath;
    const filesWithTasks = await this.getFilesWithTasks(vaultPath);
    const taskCount = filesWithTasks.length;
    new import_obsidian.Notice(`Total number of files with tasks: ${taskCount}`);
  }

  async getFilesWithTasks(dir) {
    const fs = require("fs").promises;
    const path = require("path");
    let filesWithTasks = [];

    async function readDir(dir2) {
      const normalizedDir = dir2.replace(/\\/g, "/"); // Normalize paths
      // Skip excluded folders
      if (EXCLUDED_FOLDERS.some((excluded) => normalizedDir.startsWith(excluded))) {
        return;
      }

      const files = await fs.readdir(dir2);
      for (const file of files) {
        const filePath = path.join(dir2, file).replace(/\\/g, "/"); // Normalize paths for comparison
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
    }

    await readDir(dir);
    return filesWithTasks;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
