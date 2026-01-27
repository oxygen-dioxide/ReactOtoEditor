import * as vscode from 'vscode';
import { VSCodeFileSystemAdapter } from '../Lib/FileSystem/FileSystemAdapter';

export class OtoEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new OtoEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(OtoEditorProvider.viewType, provider);
		return providerRegistration;
	}

  private static readonly viewType = 'laberu.otoEditor';

  constructor(
    private readonly context: vscode.ExtensionContext
	) { }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
  	enableScripts: true,
  };
    
    // Set up the Webview content
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'index.html');
    const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
    webviewPanel.webview.html = new TextDecoder().decode(htmlContent);
    
    // Set up message listener for file system operations
    webviewPanel.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'readFile':
            this.handleReadFile(message.path);
            break;
          case 'writeFile':
            this.handleWriteFile(message.path, message.content);
            break;
          case 'listFiles':
            this.handleListFiles(message.pattern);
            break;
          case 'exists':
            this.handleExists(message.path);
            break;
        }
      }
    );
  }
  
  private async handleReadFile(path: string): Promise<void> {
    const adapter = new VSCodeFileSystemAdapter();
    const content = await adapter.readFile(path);
    this.postMessage({ type: 'readFileResponse', content });
  }
  
  private async handleWriteFile(path: string, content: ArrayBuffer): Promise<void> {
    const adapter = new VSCodeFileSystemAdapter();
    await adapter.writeFile(path, content);
    this.postMessage({ type: 'writeFileResponse' });
  }
  
  private async handleListFiles(pattern: string): Promise<void> {
    const adapter = new VSCodeFileSystemAdapter();
    const files = await adapter.listFiles(pattern);
    this.postMessage({ type: 'listFilesResponse', files });
  }
  
  private async handleExists(path: string): Promise<void> {
    const adapter = new VSCodeFileSystemAdapter();
    const exists = await adapter.exists(path);
    this.postMessage({ type: 'existsResponse', exists });
  }
  
  private postMessage(message: any): void {
    // This would be implemented based on how you want to send messages back to the webview
    // For example: this.webviewPanel.webview.postMessage(message);
  }
}