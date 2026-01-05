import { prisma } from "~/db.server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");

// Ensure upload directory exists
async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function getAllDocuments() {
    return prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: {
                    username: true,
                },
            },
        },
    });
}

export async function createDocument({
    name,
    type,
    size,
    category,
    ownerId,
    fileBuffer,
}: {
    name: string;
    type: string;
    size: string;
    category: string;
    ownerId: string;
    fileBuffer: Buffer;
}) {
    await ensureUploadDir();

    // Generate unique filename to avoid collisions
    const ext = path.extname(name);
    const uniqueName = `${path.basename(name, ext)}_${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    const publicPath = `/uploads/documents/${uniqueName}`;

    // Write file to disk
    await fs.writeFile(filePath, fileBuffer);

    // Determine simpler type for UI
    let simpleType = "other";
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".pdf")) simpleType = "pdf";
    else if (lowerName.match(/\.(jpg|jpeg|png|gif|webp)$/)) simpleType = "image";
    else if (lowerName.match(/\.(xls|xlsx|csv)$/)) simpleType = "spreadsheet";
    else if (lowerName.match(/\.(doc|docx)$/)) simpleType = "doc";

    // create db record
    return prisma.document.create({
        data: {
            name,
            type: simpleType, // storing the UI-friendly type
            size,
            category, // e.g., 'contracts', 'invoices'
            path: publicPath,
            ownerId,
        },
    });
}

export async function deleteDocument(id: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return null;

    // Delete file from disk
    // Note: document.path is like "/uploads/documents/file.pdf"
    // We need to construct absolute path
    const absolutePath = path.join(process.cwd(), "public", document.path.replace(/^\//, ""));

    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        console.warn(`Failed to delete file at ${absolutePath}:`, error);
        // Continue deleting DB record even if file is missing
    }

    return prisma.document.delete({ where: { id } });
}

export async function getDocumentsByCategory(category: string) {
    return prisma.document.findMany({
        where: { category },
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: { username: true }
            }
        }
    })
}
