import { cfg } from "@/infra";

export const isTesting = cfg.NODE_ENV === "test";
export const isProduction = cfg.NODE_ENV === "production";
export const isDevelopment = !isTesting && !isProduction;