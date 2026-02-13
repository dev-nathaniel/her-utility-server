// // tracer/globalPatch.ts
// import express from "express";
// import type { Request, Response, NextFunction, Router } from "express";
// import { wrapMiddleware, wrapRouteHandler } from "./index.js";

// console.log("[TRACE] Global Router patch applied");

// // 3. THIS IS CRITICAL: Get Router prototype
// const originalRouter = express.Router;
// const routerProto = originalRouter.prototype;

// console.log(routerProto, 'routerProto');


// // (express as any).Router = function (options?: express.RouterOptions) {
// //     const router = originalRouter.call(this, options);

// //     // 4. Patch Router.prototype methods (get, post, put, delete, etc.)
// //     ['get', 'post', 'put', 'delete', 'patch', 'all', 'head', 'options'].forEach(method => {
// //         const originalMethod = (router as any)[method];
// //         console.log(originalMethod, 'originalMethod for router');
// //         (router as any)[method] = function (this: any, path: string, ...handlers: any[]) {
// //             console.log(`🔧 Patching route: ${method.toUpperCase()} ${path}`);

// //             const wrappedHandlers = handlers.map(handler => {
// //                 if (typeof handler === 'function' && !handler.__traced) {
// //                     console.log(`  ✅ Wrapping handler: ${handler.name || 'anonymous'}`);
// //                     return wrapRouteHandler(method.toUpperCase(), path, handler);
// //                 }
// //                 return handler;
// //             });

// //             return originalMethod.call(this, path, ...wrappedHandlers);
// //         };
// //     });

// //     // 5. Also patch Router.prototype.use for router-level middleware
// //     const originalRouterUse = (router as any).use;
// //     console.log(originalRouterUse, 'originalRouterUse');
// //     (router as any).use = function (this: any, ...args: any[]) {
// //         const wrappedArgs = args.map(arg => {
// //             if (typeof arg === 'function' && !arg.__traced) {
// //                 return wrapMiddleware(arg);
// //             }
// //             return arg;
// //         });
// //         return originalRouterUse.call(this, ...wrappedArgs);
// //     };
// //     return router;
// // };

// // 4. Patch Router.prototype methods (get, post, put, delete, etc.)
// ['get', 'post', 'put', 'delete', 'patch', 'all', 'head', 'options'].forEach(method => {
//     const originalMethod = (routerProto as any)[method];
//     console.log(originalMethod, 'originalMethod for router');
//     (routerProto as any)[method] = function (this: any, path: string, ...handlers: any[]) {
//         console.log(`🔧 Patching route: ${method.toUpperCase()} ${path}`);

//         const wrappedHandlers = handlers.map(handler => {
//             if (typeof handler === 'function' && !handler.__traced) {
//                 console.log(`  ✅ Wrapping handler: ${handler.name || 'anonymous'}`);
//                 return wrapRouteHandler(method.toUpperCase(), path, handler);
//             }
//             return handler;
//         });

//         return originalMethod.call(this, path, ...wrappedHandlers);
//     };
// });

// // 5. Also patch Router.prototype.use for router-level middleware
// const originalRouterUse = (routerProto as any).use;
// console.log(originalRouterUse, 'originalRouterUse');
// (routerProto as any).use = function (this: any, ...args: any[]) {
//     const wrappedArgs = args.map(arg => {
//         if (typeof arg === 'function' && !arg.__traced) {
//             console.log(`  ✅ Wrapping middleware: ${arg.name || 'anonymous'}`);
//             return wrapMiddleware(arg);
//         }
//         return arg;
//     });
//     return originalRouterUse.call(this, ...wrappedArgs);
// };