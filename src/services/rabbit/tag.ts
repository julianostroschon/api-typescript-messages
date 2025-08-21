import { packageInfo } from "@/infra";
import { parseDate } from "@/utils";

export function buildConsumerTag(queue: string): string {
  const appVersion = packageInfo.version ?? 'v?';
  const timestamp = new Date().getTime();

  return `${packageInfo.name}-${appVersion}-${queue}-${parseDate(
    timestamp
  )}`;
}