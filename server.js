import express from "express";
import { createRequestHandler } from "react-router";
import * as path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_PATH = path.resolve(__dirname, "build/server/index.js");

function createRequest(req, res) {
    const origin = `${req.protocol}://${req.get("host")}`;
    const url = new URL(req.url, origin);

    const controller = new AbortController();
    res.on("close", () => controller.abort());

    const init = {
        method: req.method,
        headers: createHeaders(req.headers),
        signal: controller.signal,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = req;
        init.duplex = "half";
    }

    return new Request(url.href, init);
}

function createHeaders(requestHeaders) {
    const headers = new Headers();
    for (const [key, values] of Object.entries(requestHeaders)) {
        if (values) {
            if (Array.isArray(values)) {
                for (const value of values) {
                    headers.append(key, value);
                }
            } else {
                headers.set(key, values);
            }
        }
    }
    return headers;
}

async function startServer() {
    const app = express();

    // Serve static assets with caching
    app.use(
        "/assets",
        express.static("build/client/assets", { immutable: true, maxAge: "1y" })
    );
    app.use(express.static("build/client", { maxAge: "1h" }));

    // Import the build
    const build = await import(BUILD_PATH);

    // Create handler using the build
    const handleRequest = createRequestHandler(build, "production");

    app.all("*", async (req, res, next) => {
        try {
            const request = createRequest(req, res);
            const response = await handleRequest(request);

            if (!response) return next();

            res.status(response.status);
            response.headers.forEach((value, key) => res.append(key, value));

            if (response.body) {
                Readable.fromWeb(response.body).pipe(res);
            } else {
                res.end();
            }
        } catch (error) {
            console.error("Server Error:", error);
            next(error);
        }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Production server listening on http://localhost:${port}`);
    });
}

startServer();
