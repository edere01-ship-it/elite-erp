import { createCookieSessionStorage } from "react-router";

type SessionData = {
    userId: string;
};

type SessionFlashData = {
    error: string;
};

export const { getSession, commitSession, destroySession } =
    createCookieSessionStorage<SessionData, SessionFlashData>({
        cookie: {
            name: "__session",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            sameSite: "lax",
            secrets: ["s3cr3t_key_change_this_later"],
            secure: process.env.NODE_ENV === "production",
        },
    });
