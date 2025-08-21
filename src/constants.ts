import { packageInfo } from "@/infra";

const [API_MAJOR_VERSION] = (packageInfo && packageInfo.version ? packageInfo.version : "1.0.0").split(".");
const URL_PREFIX = `/api/v${API_MAJOR_VERSION}/`;
const PROJECT_NAME = packageInfo.name;

export { PROJECT_NAME, URL_PREFIX };

