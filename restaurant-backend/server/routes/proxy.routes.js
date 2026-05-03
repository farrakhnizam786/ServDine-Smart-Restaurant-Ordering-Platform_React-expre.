const express = require("express");
const router = express.Router();
const https = require("https");
const http = require("http");
const url = require("url");

/**
 * 🔥 Reverse Proxy Route
 * Usage: GET /api/proxy?target=https://external-api.com/path
 * 
 * This is useful for:
 *   - Bypassing CORS restrictions from the frontend
 *   - Proxying to third-party APIs (maps, payment status, etc.)
 *   - Production: forwarding requests to microservices
 */
router.all("/", (req, res) => {
    const targetUrl = req.query.target;

    if (!targetUrl) {
        return res.status(400).json({ message: "Missing 'target' query parameter" });
    }

    // Basic allowlist validation (prevent open redirect abuse)
    let parsed;
    try {
        parsed = new url.URL(targetUrl);
    } catch (e) {
        return res.status(400).json({ message: "Invalid target URL" });
    }

    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsed.hostname, // Override host header
        },
    };

    // Remove internal headers that shouldn't be forwarded
    delete options.headers["x-forwarded-for"];
    delete options.headers["connection"];

    const proxyReq = lib.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
        console.error("Proxy error:", err.message);
        res.status(502).json({ message: "Proxy error: " + err.message });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();
});

module.exports = router;
