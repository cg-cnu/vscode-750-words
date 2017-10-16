import {window, Uri, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import * as fs from 'fs';
import * as mdfp from 'node-mkdirfilep';

export function activate(ctx: ExtensionContext) {

    // create a new word counter
    const wordCounter = new WordCounter();
    const controller = new WordCounterController(wordCounter);

    const today = commands.registerCommand('words750.today', () => {
        // const date = getDate();
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth()
        const day = today.getDate()
        const rootPath = workspace.getConfiguration().get('rootPath')
        const filePath = `${rootPath}/${year}/${month}/${day}.words750.txt`;
        if( ! fs.existsSync(filePath) ){
            // create the file... if it don't exist
            // fs.closeSync(fs.openSync(filePath, 'a'))
            mdfp.create(filePath)
        }
        workspace.openTextDocument( Uri.file( filePath ) )
            .then( (doc) => {
                window.showTextDocument(doc);
            })
    })

    ctx.subscriptions.push(today);
    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(wordCounter);
}

/**
 * Returns the page for a day with the given offset. If the page doesn't exist yet, it will be created (with the current date as header) 
 * @param {number} offset - 0 is today, -1 is yesterday
 */
const getPagePath = (date) => {

    const rootPath = `/Users/admin/.words750`
    return `${rootPath}/${date}.words750.txt`;
}

const getDate = () => {
    var today = new Date();
    var dd = today.getDate()
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    
    // if(dd<10) {
    //     const dds = '0'+ dd.toString()
    // } 
    
    // if(mm<10) {
    //     const mms = '0'+ mm.toString()
    // } 
    
    console.log('`${yyyy}-${mm}-${dd}`;', `${yyyy}-${mm}-${dd}`)
    return `${yyyy}-${mm}-${dd}`;    
    

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