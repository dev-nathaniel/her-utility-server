// // tracer/tracer.ts

// export type TraceStep = {
//   type: string;
//   name: string;
//   startTime: number;
//   endTime?: number;
//   duration?: number;
//   metadata?: any;
//   result?: any;
// };

// export type Trace = {
//   requestId: string;
//   endpoint: string;
//   startTime: number;
//   endTime?: number;
//   totalDuration?: number;
//   steps: TraceStep[];
//   currentStep: TraceStep | null;
// };

// export class RequestTracer {
//   private activeTraces: Map<string, Trace>;
//   private wsUrl: string | null = null;
//   private canvasId: string | null = null;

//   constructor() {
//     this.activeTraces = new Map(); // requestId -> trace data
//   }

//   connect(wsUrl: string, canvasId: string | null) {
//     this.wsUrl = wsUrl;
//     this.canvasId = canvasId;
//     console.log(`[TRACE] Connected to ${wsUrl} for canvas ${canvasId}`);
//   }

//   startTrace(requestId: string, endpoint: string) {
//     this.activeTraces.set(requestId, {
//       requestId,
//       endpoint,
//       startTime: Date.now(),
//       steps: [],
//       currentStep: null
//     });
//   }

//   // Alias for addStep to match usage in index.ts
//   stepStart(requestId: string, stepType: string, nameOrMetadata: string | any) {
//     const metadata = typeof nameOrMetadata === 'string' ? { name: nameOrMetadata } : nameOrMetadata;
//     this.addStep(requestId, stepType, metadata);
//   }

//   addStep(requestId: string, stepType: string, metadata: any = {}) {
//     const trace = this.activeTraces.get(requestId);
//     if (!trace) return;

//     const step: TraceStep = {
//       type: stepType, // 'middleware', 'route', 'controller', 'service', etc.
//       name: metadata.name || 'unknown',
//       startTime: Date.now(),
//       metadata
//     };

//     trace.steps.push(step);
//     trace.currentStep = step;

//     // Emit to your real-time visualization (WebSocket, etc.)
//     this.emit('step:start', { requestId, step });
//   }

//   // Alias for completeStep to match usage in index.ts
//   stepEnd(requestId: string, result: any = {}) {
//     this.completeStep(requestId, result);
//   }

//   completeStep(requestId: string, result: any = {}) {
//     const trace = this.activeTraces.get(requestId);
//     if (!trace || !trace.currentStep) return;

//     trace.currentStep.endTime = Date.now();
//     trace.currentStep.duration = trace.currentStep.endTime - trace.currentStep.startTime;
//     trace.currentStep.result = result;

//     this.emit('step:complete', { requestId, step: trace.currentStep });
//     trace.currentStep = null; // Reset current step
//   }

//   endTrace(requestId: string, statusCode?: number) {
//     const trace = this.activeTraces.get(requestId);
//     if (!trace) return;

//     trace.endTime = Date.now();
//     trace.totalDuration = trace.endTime - trace.startTime;
//     if (statusCode) {
//         (trace as any).statusCode = statusCode;
//     }

//     this.emit('trace:complete', trace);
//     this.activeTraces.delete(requestId);
//   }

//   emit(event: string, data: any) {
//     // Send to WebSocket, message queue, etc.
//     console.log(`[${event}]`, JSON.stringify(data, null, 2));
//     // wsServer.broadcast({ event, data });
//   }
// }

// const tracer = new RequestTracer();
// export default tracer;