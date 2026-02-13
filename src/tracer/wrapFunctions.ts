// // tracer/wrapFunctions.ts

// type LogEvent = {
//   event: string;
//   function?: string;
//   [key: string]: any;
// };

// type Logger = (event: LogEvent) => void;

// export function wrapFunction(fn: Function, name: string, out: Logger) {
//   return function wrappedFunction(this: any, ...args: any[]) {
//     out({
//       event: "enter_function",
//       function: name,
//     });

//     const result = fn.apply(this, args);

//     out({
//       event: "exit_function",
//       function: name,
//     });

//     return result;
//   };
// }

// // Automatically wrap all functions exported from a module
// export function autoWrapModule(moduleObj: any, moduleName: string, out: Logger) {
//   const wrapped: any = {};

//   for (const key in moduleObj) {
//     if (typeof moduleObj[key] === "function") {
//       wrapped[key] = wrapFunction(moduleObj[key], `${moduleName}.${key}`, out);
//     } else {
//       wrapped[key] = moduleObj[key];
//     }
//   }

//   return wrapped;
// }
