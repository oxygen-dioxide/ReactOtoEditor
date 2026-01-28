import * as vscode from 'vscode';  
import { VSCodeFileSystemAdapter } from '../lib/FileSystem/FileSystemAdapter';  
import { OtoEditorProvider } from './otoEditor';
  
export function activate(context: vscode.ExtensionContext) {  
  context.subscriptions.push(OtoEditorProvider.register(context));
  // 注册命令  
  /*const disposable = vscode.commands.registerCommand('laberu.openEditor', async () => {  
    // 创建文件系统适配器  
    const fileSystem = new VSCodeFileSystemAdapter();  
      
    // 创建Webview面板  
    const panel = vscode.window.createWebviewPanel(  
      'laberuEditor',  
      'LABERU Oto Editor',  
      vscode.ViewColumn.One,  
      {  
        enableScripts: true,  
        localResourceRoots: [context.extensionUri]  
      }  
    );  
      
    // 设置文件系统适配器  
    panel.webview.postMessage({  
      type: 'setFileSystem',  
      adapter: 'vscode'  
    });  
  });  
    
  context.subscriptions.push(disposable);  */
}