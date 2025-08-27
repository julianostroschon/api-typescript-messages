import { packageInfo } from "@/infra";

const [API_MAJOR_VERSION] = (packageInfo && packageInfo.version ? packageInfo.version : "1.0.0").split(".");
const URL_PREFIX = `/api/v${API_MAJOR_VERSION}/`;
const PROJECT_NAME = packageInfo.name;

const HTTP_STATUS = {
  SUCCESS: 200,
  ERROR: {
    BAD_USER_INPUT: 400,
    SERVER_INTERNAL: 500
  }
}

export { HTTP_STATUS, PROJECT_NAME, URL_PREFIX };

