import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

export function activate(ctx: ExtensionContext) {

    // create a new word counter
    const wordCounter = new WordCounter();
    const controller = new WordCounterController(wordCounter);

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
        // Only update status if an MD file
        // only if file name ends with .words750.txt
        if (doc.languageId === "plaintext" && doc.fileName.endsWith('.words750.txt')) {
            let wordCount = this._getWordCount(doc);

            // doc.fileName
            console.log('doc.fileName', doc.fileName)
            // Update the status bar
            const percentage = ( wordCount / 750 * 100 ).toFixed(1)
            this._statusBarItem.text = ` ${percentage} % - ${wordCount} / 750 Words`;
            this._statusBarItem.show();
        } else {
            // make this a button 
            // open todays page on click 
            this._statusBarItem.text = `750 Words`;
            this._statusBarItem.show();
        }
    }

    public _getWordCount(doc: TextDocument): number {
        let docContent = doc.getText();

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
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