import type { JwtPayload } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      /**
       * Unique request identifier propagated through the request lifecycle.
       */
      requestId?: string;
      /**
       * Authenticated user payload injected by auth middleware.
       */
      user?: JwtPayload | null;
      /**
       * Optional container for request-scoped validated payloads.
       */
      validated?: unknown;
      /**
       * Express router metadata describing the matched route.
       */
      route?: {
        path?: string;
      };
      /**
       * Optional CSRF token generator injected by csurf middleware.
       */
      csrfToken?: () => string;
    }

    interface Locals {
      requestId?: string;
    }
  }
}

export {};
