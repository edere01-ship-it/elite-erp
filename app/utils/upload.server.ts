import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const BASE_UPLOAD_DIR = "public/documents";

export async function uploadFile(file: File, folder: string = "archives/messaging") {
    const uploadDir = path.join(BASE_UPLOAD_DIR, folder);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file stream to buffer and write
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    // Return URL path relative to public
    // Windows paths use backslashes, need to ensure web url uses forward slashes
    const relativePath = path.posix.join("/documents", folder.split(path.sep).join('/'), fileName);
    return relativePath;
}
