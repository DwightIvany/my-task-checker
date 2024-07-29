import { Plugin, Notice } from 'obsidian';

export default class MyTaskChecker extends Plugin {
  async onload() {
    console.log('Loading Task Checker plugin');

    this.addRibbonIcon('check-circle', 'List files with tasks', () => {
      this.listFilesWithTasks();
    });

    this.addCommand({
      id: 'list-files-with-tasks',
      name: 'List Files with Tasks',
      callback: () => this.listFilesWithTasks()
    });
  }

  onunload() {
    console.log('Unloading Task Checker plugin');
  }

  async listFilesWithTasks() {
    const vaultPath = this.app.vault.adapter.basePath;
    const filesWithTasks = await this.getFilesWithTasks(vaultPath);

    if (filesWithTasks.length === 0) {
      new Notice('No files with tasks found.');
    } else {
      const fileList = filesWithTasks.join('\n');
      new Notice(`Files with tasks:\n${fileList}`);
    }
  }

  async getFilesWithTasks(dir: string): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');

    let filesWithTasks: string[] = [];

    async function readDir(dir: string) {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.lstat(filePath);

        if (stat.isDirectory()) {
          await readDir(filePath);
        } else if (file.endsWith('.md')) {
          const content = await fs.readFile(filePath, 'utf8');
          if (content.includes('- [ ]')) {
            filesWithTasks.push(filePath);
          }
        }
      }
    }

    await readDir(dir);

    return filesWithTasks;
  }
}