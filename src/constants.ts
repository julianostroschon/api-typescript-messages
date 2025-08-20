import { packageInfo } from "./infra/";
console.log({ packageInfo })
const [API_VERSION] = packageInfo?.version.split(".");

const URL_PREFIX = `/api/v${API_VERSION}/`;
const PROJECT_NAME = packageInfo.name;

export { API_VERSION, PROJECT_NAME, URL_PREFIX };

