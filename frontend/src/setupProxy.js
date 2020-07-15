const { createProxyMiddleware } = require('http-proxy-middleware');

const SERVER_PORT = process.env.SERVER_PORT || '4000';

module.exports = function (app) {
    app.use(
        '/graphql',
        createProxyMiddleware({
            target: `http://localhost:${SERVER_PORT}`,
            changeOrigin: true,
        }),
    );
    app.use(
        '/auth/gmail',
        createProxyMiddleware({
            target: `http://localhost:${SERVER_PORT}`,
            changeOrigin: true,
        }),
    );
    app.use(
        '/oauth2callback',
        createProxyMiddleware({
            target: `http://localhost:${SERVER_PORT}`,
            changeOrigin: true,
        }),
    );
};
