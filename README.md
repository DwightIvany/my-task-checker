Periodically (at least weekly), I like to make sure I know where all my do do actions are. If they are in projects and my lastest periodic files, I can trust my system; however, if they are buried in my reference files, then I need to move them. So I wrote this simple Obsidian plugin that displays files with - [ ] actions.

To install this plug-in:
Copy main.js and manifest.json into my-task-checker folder in plugins
  
3. Enable a hotkey for task checker

When run Onsidian will do 2 things:
1. Click the check-circle in the ribbon bar
2. Either review the notification or
   Open the todo-files-YYYY-MM-DD.md in the root folder of your vault. 
3. Once done with the list of files, simply delete it.

One 2024-11-28 I edited the main.js to have explicit exclude for files and folders. Ideally I would have edited main.ts, and implemented Obsidian UI. But that was taking too much time troubleshooting, so I just hard coded my own solution. Email me, if you need help.

Note to self, if I iterate the UI, I must get main.ts to do the exclusions first.
