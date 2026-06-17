import type { Repositories } from "../repos/index.js";

export interface ApiEnv {
  Variables: {
    repositories: Repositories;
  };
}
