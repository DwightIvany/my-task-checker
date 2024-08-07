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

    this.addCommand({
      id: 'show-task-count',
      name: 'Show Task Count',
      callback: () => this.showTaskCount()
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
      const currentDate = new Date();
      const localDate = currentDate.toLocaleDateString('en-CA'); // Formats the date as YYYY-MM-DD
      const fileName = `todo-files-${localDate}.md`;
      const filePath = `${vaultPath}/${fileName}`;
      
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
