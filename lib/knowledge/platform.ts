import { env } from "./local-records";
export function binding(name: string): any {
  return env[name];
}
export function secret(name: string): string {
  return String(process.env[name] ?? env[name] ?? "");
}
