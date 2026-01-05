
try {
    await import("express");
    console.log("express: OK");
} catch (e) {
    console.error("express: MISSING", e.message);
}

try {
    await import("react-router");
    console.log("react-router: OK");
} catch (e) {
    console.error("react-router: MISSING", e.message);
}

try {
    const rr = await import("react-router");
    if (rr.createRequestHandler) console.log("createRequestHandler in react-router: YES");
    else console.log("createRequestHandler in react-router: NO");
} catch (e) { }

try {
    await import("@react-router/node");
    console.log("@react-router/node: OK");
} catch (e) {
    console.error("@react-router/node: MISSING", e.message);
}
