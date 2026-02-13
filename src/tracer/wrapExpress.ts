// // tracer/wrapExpress.ts
// import type { Application, Request, Response, NextFunction } from 'express';

// type LogEvent = {
//   event: string;
//   [key: string]: any;
// };

// type Logger = (event: LogEvent) => void;

// export default function wrapExpress(app: Application, out: Logger) {
//   // Patch app.use to detect middleware registration
//   const originalUse = app.use;
//   app.use = function (this: Application, ...args: any[]) {
//     const fn = args[0];
//     if (typeof fn === 'function') {
//         out({
//         event: "middleware_registered",
//         name: fn.name || "anonymous_middleware",
//         });
//     }

//     return originalUse.apply(this, args as any);
//   };

//   // Patch routing: app.get, app.post, router.get, etc.
//   const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;

//   HTTP_METHODS.forEach((method) => {
//     const original = (app as any)[method];

//     (app as any)[method] = function (path: string, ...handlers: any[]) {
//       out({
//         event: "route_registered",
//         method,
//         path,
//       });

//       // Wrap each route handler
//       const wrappedHandlers = handlers.map((handler) => {
//         if (typeof handler !== 'function') return handler;
        
//         return function wrappedHandler(req: Request, res: Response, next: NextFunction) {
//           out({
//             event: "enter_handler",
//             method,
//             path,
//             handler: handler.name || "anonymous_handler",
//           });

//           const result = handler(req, res, next);

//           out({
//             event: "exit_handler",
//             method,
//             path,
//             handler: handler.name || "anonymous_handler",
//           });

//           return result;
//         };
//       });

//       return original.call(app, path, ...wrappedHandlers);
//     };
//   });

//   out({ event: "express_patched" });
// }
