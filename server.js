require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const {default: createShopifyAuth} = require('@shopify/koa-shopify-auth');
const {verifyRequest} = require('@shopify/koa-shopify-auth');
const {default: Shopify, ApiVersion} = require('@shopify/shopify-api');
const Router = require('koa-router');
const cors = require('cors')
const sendToTracksend = require('./api-calls/index')
dotenv.config();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_API_SCOPES.split(","),
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

const port = parseInt(process.env.PORT, 10) || 5000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev: dev});
const handle = app.getRequestHandler();
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        const {shop, scope, accessToken} = ctx.state.shopify;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;
        // Unistall Webhook to disconnect user from store 
        const registerUninstallWebhook = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: '/webhooks',
          topic: 'APP_UNINSTALLED',
          apiVersion: ApiVersion.October20,
          webhookHandler: (_topic, shop, _body) => {
            console.log('App uninstalled');
            delete ACTIVE_SHOPIFY_SHOPS[shop];
          },
        });
      
        if (registerUninstallWebhook.success) {
          console.log('Successfully registered webhook!');
        } else {
          console.log('Failed to register webhook', registerUninstallWebhook.result);
        }
        // Listen for Order Updates 
        const orderUpdateWebhook = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: '/webhooks',
          topic: 'ORDERS_UPDATED',
          apiVersion: ApiVersion.October20,
          webhookHandler: (_topic, shop, _body) => {
            // Send to tracksend
            const obj = JSON.parse(_body);
            sendToTracksend(_topic, obj, shop)
            console.log('Orders updated', _topic);
          },
        });
      
        if (orderUpdateWebhook.success) {
          console.log('Successfully registered webhook!');
        } else {
          console.log('Failed to register webhook', orderUpdateWebhook.result);
        }
        ctx.redirect(`/?shop=${shop}`);
      },
    }),
  );

  router.post("/graphql", verifyRequest({returnHeader: true}), async (ctx, next) => {
    await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
  });
  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.get("/", async (ctx) => {
    const shop = ctx.query.shop;

    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  router.get("(/_next/static/.*)", handleRequest);
  router.get("/_next/webpack-hmr", handleRequest);
  router.get("(.*)", verifyRequest(), handleRequest);

  router.post('/webhooks', async (ctx) => {
    await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);  
    console.log(`Webhook processed with status code 200`);
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.use(cors())

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});