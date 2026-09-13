# Task Checker

An [Obsidian](https://obsidian.md) plugin that scans your vault for notes containing incomplete tasks (`- [ ]`) and writes a dated list of links to a file.

## Features

- **List Files with Tasks** — scans every markdown file in your vault and writes `todo-files-YYYY-MM-DD.md` to the vault root, containing one `[[wikilink]]` per note that has at least one unchecked task
- **Show Task Count** — displays a notice with the number of notes containing incomplete tasks
- **Ribbon icon** — the check-circle icon in the ribbon runs the same scan as the command
- **Exclusions** — configure excluded folders and excluded files in settings; excluded folders are skipped entirely during the scan, excluded files are skipped individually
- **Settings UI** — add, edit, reorder, and remove exclusion entries

## Requirements

- Obsidian 1.4.0 or later (desktop only — the plugin reads your vault through Node's filesystem API, which the mobile app does not support)

## Installation

Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/DwightIvany/my-task-checker/releases/latest) and copy them into your vault's plugin folder:

```
<your vault>/.obsidian/plugins/my-task-checker/
```

Create the `my-task-checker` folder if it doesn't exist. Then enable the plugin under **Settings → Community plugins**.

## Usage

1. Click the check-circle ribbon icon, or run the **List Files with Tasks** command
2. Open the generated `todo-files-YYYY-MM-DD.md` in your vault root — each line links to a note with open tasks
3. Work through the list; delete the file when you're done

The **Show Task Count** command reports how many notes contain incomplete tasks without writing a file.

## Configuration

Go to **Settings → Task Checker**:

- **Excluded Folders** — absolute paths of folders skipped during the scan (the folder and everything under it)
- **Excluded Files** — absolute paths of individual files skipped during the scan

Use the arrow buttons to reorder entries and the trash icon to remove them. Entries are stored in the plugin's `data.json`.

## Building from source

With Node.js installed:

```bash
npm install
npm run build        # writes main.js to this folder (repo root)
```

For development with watch mode:

```bash
npm run dev
```

On Windows without Node/npm, use the standalone build script (downloads `tools/esbuild.exe` on first run):

```powershell
.\build.ps1
```

The script builds `main.js` in the repo root and copies `main.js`, `manifest.json`, and `styles.css` into `../../../.obsidian/plugins/my-task-checker` (relative to this folder), ready to reload in Obsidian.

## License

[Apache License 2.0](LICENSE)
