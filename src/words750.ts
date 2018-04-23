import {
  window,
  Uri,
  workspace,
  commands,
  Disposable,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument
} from "vscode";
import * as fs from "fs";
import * as mdfp from "node-mkdirfilep";
import * as path from "path";

function getRootPath() {
  var config: string = workspace.getConfiguration().get("words750.path");
  if (!config) {
    config = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
  }
  return path.join(config, ".words750");
}

export function activate(ctx: ExtensionContext) {
  // create a new word counter
  const wordCounter = new WordCounter();
  const controller = new WordCounterController(wordCounter);

  // open the words750 project file
  const open = commands.registerCommand("words750.open", () => {
    // open project in a new window
    commands.executeCommand("vscode.openFolder", Uri.file(getRootPath()), true);
  });

  const today = commands.registerCommand("words750.today", () => {
    // get file path
    const today = new Date();
    const path = `${getRootPath()}/${today.getFullYear()}/${today.getMonth()+1}`;
    const name = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.words750.txt`;
    const filePath = `${path}/${name}`;
    // create the file... if it don't exist
    if (!fs.existsSync(filePath)) {
      mdfp.create(filePath);
    }
    // open file
    workspace.openTextDocument(Uri.file(filePath)).then(doc => {
      window.showTextDocument(doc);
    });
  });

  ctx.subscriptions.push(today);
  ctx.subscriptions.push(open);
  ctx.subscriptions.push(controller);
  ctx.subscriptions.push(wordCounter);
}

export class WordCounter {
  private _statusBarItem: StatusBarItem;

  public updateWordCount() {
    // Create as needed
    if (!this._statusBarItem) {
      this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    }

    // Get the current text editor
    let editor = window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }

    let doc = editor.document;
    if (
      doc.languageId === "plaintext" &&
      doc.fileName.endsWith(".words750.txt")
    ) {
      // only update if file name ends with .words750.txt
      let wordCount = this._getWordCount(doc);
      const percentage = (wordCount / 750 * 100).toFixed(1);
      this._statusBarItem.text = `${wordCount} / 750 Words [ ${percentage} % ]`;
      this._statusBarItem.show();
    }
    // IDEA: logged by salapati @ 2017-10-16 09:42:13
    // only show if today's 750 is not completely written
    // show percentage next to it.
  }

  // IDEA: logged by salapati @ 2017-10-16 09:42:58
  // show a prompt first time vscode is launched in a day ?

  public _getWordCount(doc: TextDocument): number {
    let docContent = doc.getText();

    // Parse out unwanted whitespace so the split is accurate
    docContent = docContent.replace(/(< ([^>]+)<)/g, "").replace(/\s+/g, " ");
    docContent = docContent.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    let wordCount = 0;
    if (docContent != "") {
      wordCount = docContent.split(" ").length;
    }

    return wordCount;
  }

  public dispose() {
    this._statusBarItem.dispose();
  }
}

class WordCounterController {
  private _wordCounter: WordCounter;
  private _disposable: Disposable;

  constructor(wordCounter: WordCounter) {
    this._wordCounter = wordCounter;
    this._wordCounter.updateWordCount();

    // subscribe to selection change and editor activation events
    let subscriptions: Disposable[] = [];
    window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
    window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

    // create a combined disposable from both event subscriptions
    this._disposable = Disposable.from(...subscriptions);
  }

  private _onEvent() {
    this._wordCounter.updateWordCount();
  }

  public dispose() {
    this._disposable.dispose();
  }
}
