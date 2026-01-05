export interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'doc' | 'spreadsheet' | 'other';
    size: string;
    updatedAt: string;
    category: 'contracts' | 'invoices' | 'plans' | 'hr' | 'legal' | 'marketing';
    path: string;
    owner: string;
}

export interface Folder {
    id: string;
    name: string;
    type: 'folder';
    itemCount: number;
    updatedAt: string;
    path: string;
}

export type FileSystemItem = Document | Folder;
