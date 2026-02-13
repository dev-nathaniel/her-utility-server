// // // tracer/index.ts
// // import type { Application } from 'express';
// // import wrapExpress from './wrapExpress.js';
// // import { autoWrapModule } from './wrapFunctions.js';

// // type TracerOptions = {
// //   output?: (event: any) => void;
// // };

// // // This function initializes the tracer and instruments Express
// // export default function initTracer(app: Application, options: TracerOptions = {}) {
// //   const out = options.output || console.log;

// //   // Patch express routing & middleware
// //   wrapExpress(app, out);

// //   return {
// //     wrapFunctions: (moduleObj: any, moduleName: string) =>
// //       autoWrapModule(moduleObj, moduleName, out),
// //   };
// // }


// // your-package/index.ts
// import type { Application, Request, Response, NextFunction, Router } from 'express';
// import tracer from './tracer.js';
// import express from 'express';
// import { AsyncLocalStorage } from 'node:async_hooks';

// const asyncLocalStorage = new AsyncLocalStorage<{ requestId: string; startTime: number }>();

// function generateId() {
//     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// }

// export type AutoTraceOptions = {
//     wsUrl?: string;
//     canvasId?: string | null; // Added null to match default
// };

// export function autoTrace(app: Application, options: AutoTraceOptions = {}) {
//     console.log("Auto tracing enabled");
//   const {
//     wsUrl = null,
//     // wsUrl = 'ws://localhost:8080',
//     canvasId = null
//   } = options;

//   // Connect to your canvas backend
//   if (wsUrl) {
//       tracer.connect(wsUrl, canvasId);
//   }
//   console.log(app, 'app');
//   // 1. Intercept ALL middleware registration
//   const originalUse = app.use.bind(app);
//   console.log(originalUse, 'originalUse');
//   app.use = function(this: Application, ...args: any[]) {
//     const wrappedArgs = args.map(arg => {
//       if (typeof arg === 'function') {
//         return wrapMiddleware(arg);
//       }
//       return arg;
//     });
//     return originalUse(...wrappedArgs);
//   };

//   // 2. Intercept ALL route registrations (get, post, put, delete, etc.)
//   const methods = ['get', 'post', 'put', 'delete', 'patch', 'all'] as const;
//   methods.forEach(method => {
//     const original = (app as any)[method].bind(app);
//     (app as any)[method] = function(path: string, ...handlers: any[]) {
//       const wrappedHandlers = handlers.map(handler => 
//         wrapRouteHandler(method.toUpperCase(), path, handler)
//       );
//       return original(path, ...wrappedHandlers);
//     };
//   });

  

//   // 6. Add entry middleware automatically
//   app.use((req: Request, res: Response, next: NextFunction) => {
//     const requestId = generateId();
//     const store = { requestId, startTime: Date.now() };
    
//     asyncLocalStorage.run(store, () => {
//       tracer.startTrace(requestId, `${req.method} ${req.path}`);
      
//       res.on('finish', () => {
//         tracer.endTrace(requestId, res.statusCode);
//       });
      
//       next();
//     });
//   });
// }

// export function wrapMiddleware(fn: any) {
//   // Skip if already wrapped
//   if (fn.__traced) return fn;
  
//   const wrapped = async function(req: Request, res: Response, next: NextFunction) {
//     const store = asyncLocalStorage.getStore();
//     if (!store) return fn(req, res, next);
    
//     const middlewareName = fn.name || 'anonymous';
//     tracer.stepStart(store.requestId, 'middleware', middlewareName);
    
//     try {
//       await fn(req, res, (...args: any[]) => {
//         tracer.stepEnd(store.requestId);
//         next(...args);
//       });
//     } catch (error: any) {
//       tracer.stepEnd(store.requestId, { error: error.message });
//       throw error;
//     }
//   };
  
//   (wrapped as any).__traced = true;
//   return wrapped;
// }

// export function wrapRouteHandler(method: string, path: string, handler: any) {
//   if (handler.__traced) return handler;
  
//   const wrapped = async function(req: Request, res: Response, next: NextFunction) {
//     const store = asyncLocalStorage.getStore();
//     if (!store) return handler(req, res, next);
    
//     const handlerName = handler.name || 'anonymous';
//     tracer.stepStart(store.requestId, 'route', `${method} ${path} -> ${handlerName}`);
    
//     try {
//       const result = await handler(req, res, next);
//       tracer.stepEnd(store.requestId);
//       return result;
//     } catch (error: any) {
//       tracer.stepEnd(store.requestId, { error: error.message });
//       throw error;
//     }
//   };
  
//   (wrapped as any).__traced = true;
//   return wrapped;
// }