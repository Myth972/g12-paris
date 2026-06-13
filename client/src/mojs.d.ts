declare module "@mojs/core" {
  const mojs: {
    Shape: new (opts: Record<string, any>) => { play(): any; destroy(): void };
    ShapeSwirl: new (opts: Record<string, any>) => { play(): any; destroy(): void };
    Burst: new (opts: Record<string, any>) => { play(): any; destroy(): void };
    Html: new (opts: Record<string, any>) => { play(): any; destroy(): void; then(opts: Record<string, any>): any };
    Transit: new (opts: Record<string, any>) => { play(): any; destroy(): void };
    Timeline: new () => { add(...animations: any[]): any; play(): any; stop(): void };
    Tween: new (opts: Record<string, any>) => { play(): any; destroy(): void };
    CustomShape: new () => { getShape(): string; getLength(): number };
    addShape: (name: string, ShapeClass: any) => void;
    stagger: (fn: any) => (opts: Record<string, any>) => any;
    easing: Record<string, any>;
    [key: string]: any;
  };
  export default mojs;
}