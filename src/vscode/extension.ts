import * as vscode from 'vscode';  
import { VSCodeFileSystemAdapter } from '../lib/FileSystem/FileSystemAdapter';  
import { OtoEditorProvider } from './otoEditor';
  
export function activate(context: vscode.ExtensionContext) {  
  context.subscriptions.push(OtoEditorProvider.register(context));
}