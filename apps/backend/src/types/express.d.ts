import 'express';

declare global {
  namespace Express {
    interface User {
      sub: string;      // user ID from JWT
      role: string;     // user role (user/admin)
      iat?: number;     // issued-at timestamp
      exp?: number;     // expiration timestamp
    }

    interface Request {
      user?: User;      // attached in requireAuth
      requestId?: string; // correlation ID injected per request
    }
  }
}
