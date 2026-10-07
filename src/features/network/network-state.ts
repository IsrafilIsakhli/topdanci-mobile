let connected = true;
const listeners = new Set<() => void>();
export const isConnected = () => connected;
export function setConnected(value:boolean) { connected=value;listeners.forEach(fn=>fn()); }
export function subscribeConnection(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}