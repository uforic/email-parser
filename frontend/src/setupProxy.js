const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    app.use(
        '/graphql',
        createProxyMiddleware({
            target: 'http://localhost:4000',
            changeOrigin: true,
        }),
    );
    app.use(
        '/auth/gmail',
        createProxyMiddleware({
            target: 'http://localhost:4000',
            changeOrigin: true,
        }),
    );
    app.use(
        '/oauth2callback',
        createProxyMiddleware({
            target: 'http://localhost:4000',
            changeOrigin: true,
        }),
    );
};
