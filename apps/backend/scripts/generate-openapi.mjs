import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_VERSION = process.env.API_VERSION ?? "1.0.0";

const info = {
  title: "FitVibe API",
  version: API_VERSION,
  description:
    "OpenAPI specification for the FitVibe REST API. Generated from documentation anchors until automated zod-to-openapi wiring is complete.",
  contact: {
    name: "FitVibe Engineering",
    url: "https://fitvibe.app",
    email: "engineering@fitvibe.app",
  },
  license: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
};

const jsonContent = (schemaRef) => ({
  content: {
    "application/json": {
      schema: {
        $ref: schemaRef,
      },
    },
  },
});

const bearerAuth = {
  bearerAuth: [],
};

const paths = {
  "/auth/register": {
    post: {
      summary: "Register a new account",
      tags: ["Auth"],
      requestBody: jsonContent("#/components/schemas/RegisterRequest"),
      responses: {
        "201": jsonContent("#/components/schemas/AuthSuccessResponse"),
        "400": jsonContent("#/components/schemas/ErrorResponse"),
        "409": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/auth/login": {
    post: {
      summary: "Login with credentials",
      tags: ["Auth"],
      requestBody: jsonContent("#/components/schemas/LoginRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/AuthSuccessResponse"),
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/auth/refresh": {
    post: {
      summary: "Refresh access token",
      tags: ["Auth"],
      security: [bearerAuth],
      requestBody: jsonContent("#/components/schemas/RefreshRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/AuthSuccessResponse"),
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/auth/logout": {
    post: {
      summary: "Logout current session",
      tags: ["Auth"],
      security: [bearerAuth],
      responses: {
        "204": { description: "Logged out" },
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/users/me": {
    get: {
      summary: "Get current user profile",
      tags: ["Users"],
      security: [bearerAuth],
      responses: {
        "200": jsonContent("#/components/schemas/UserProfile"),
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
    put: {
      summary: "Update profile",
      tags: ["Users"],
      security: [bearerAuth],
      requestBody: jsonContent("#/components/schemas/UpdateProfileRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/UserProfile"),
        "400": jsonContent("#/components/schemas/ErrorResponse"),
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/users/me/preferences": {
    patch: {
      summary: "Update user preferences",
      tags: ["Users"],
      security: [bearerAuth],
      requestBody: jsonContent("#/components/schemas/UpdatePreferencesRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/UserPreferences"),
        "400": jsonContent("#/components/schemas/ErrorResponse"),
        "401": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/users/{alias}": {
    get: {
      summary: "Get public profile by alias",
      tags: ["Users"],
      parameters: [
        {
          name: "alias",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": jsonContent("#/components/schemas/PublicProfile"),
        "404": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/exercises": {
    get: {
      summary: "List exercises",
      tags: ["Exercises"],
      security: [bearerAuth],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      ],
      responses: {
        "200": jsonContent("#/components/schemas/ExerciseListResponse"),
      },
    },
    post: {
      summary: "Create exercise",
      tags: ["Exercises"],
      security: [bearerAuth],
      requestBody: jsonContent("#/components/schemas/ExerciseUpsertRequest"),
      responses: {
        "201": jsonContent("#/components/schemas/Exercise"),
        "400": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/exercises/{id}": {
    put: {
      summary: "Update exercise",
      tags: ["Exercises"],
      security: [bearerAuth],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: jsonContent("#/components/schemas/ExerciseUpsertRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/Exercise"),
        "404": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
    delete: {
      summary: "Archive exercise",
      tags: ["Exercises"],
      security: [bearerAuth],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "204": { description: "Archived" },
        "404": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/sessions": {
    get: {
      summary: "List sessions",
      tags: ["Sessions"],
      security: [bearerAuth],
      parameters: [
        {
          name: "status",
          in: "query",
          schema: { $ref: "#/components/schemas/SessionStatus" },
        },
      ],
      responses: {
        "200": jsonContent("#/components/schemas/SessionListResponse"),
      },
    },
    post: {
      summary: "Create session",
      tags: ["Sessions"],
      security: [bearerAuth],
      requestBody: jsonContent("#/components/schemas/SessionCreateRequest"),
      responses: {
        "201": jsonContent("#/components/schemas/Session"),
        "400": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/sessions/{id}/complete": {
    patch: {
      summary: "Mark session complete",
      tags: ["Sessions"],
      security: [bearerAuth],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: jsonContent("#/components/schemas/SessionCompleteRequest"),
      responses: {
        "200": jsonContent("#/components/schemas/Session"),
        "404": jsonContent("#/components/schemas/ErrorResponse"),
      },
    },
  },
  "/health": {
    get: {
      summary: "Liveness probe",
      tags: ["System"],
      responses: {
        "200": {
          description: "Service healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/metrics": {
    get: {
      summary: "Prometheus metrics",
      tags: ["System"],
      responses: {
        "200": {
          description: "Prometheus exposition format",
          content: {
            "text/plain": {
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const schemas = {
  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "E.AUTH.INVALID_CREDENTIALS" },
          message: { type: "string" },
          details: { type: "object", additionalProperties: true },
          requestId: { type: "string", format: "uuid" },
        },
        required: ["code", "message"],
      },
    },
    required: ["error"],
  },
  AuthSuccessResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", description: "JWT access token" },
      refreshToken: { type: "string", description: "JWT refresh token" },
      expiresIn: { type: "integer", example: 900 },
    },
    required: ["accessToken", "refreshToken", "expiresIn"],
  },
  RegisterRequest: {
    type: "object",
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 12 },
      alias: { type: "string", minLength: 3 },
      locale: { type: "string", example: "en" },
    },
    required: ["email", "password", "alias"],
  },
  LoginRequest: {
    type: "object",
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 12 },
      otp: { type: "string", minLength: 6, maxLength: 6 },
    },
    required: ["email", "password"],
  },
  RefreshRequest: {
    type: "object",
    properties: {
      refreshToken: { type: "string" },
    },
    required: ["refreshToken"],
  },
  UserProfile: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      alias: { type: "string" },
      status: { type: "string", enum: ["pending", "active", "archived"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      preferences: { $ref: "#/components/schemas/UserPreferences" },
    },
    required: ["id", "email", "alias", "status", "createdAt"],
  },
  PublicProfile: {
    type: "object",
    properties: {
      alias: { type: "string" },
      bio: { type: "string" },
      avatarUrl: { type: "string", format: "uri" },
      stats: {
        type: "object",
        properties: {
          completedSessions: { type: "integer" },
          badges: { type: "integer" },
        },
      },
    },
    required: ["alias"],
  },
  UserPreferences: {
    type: "object",
    properties: {
      measurementSystem: { type: "string", enum: ["metric", "imperial", "mixed"] },
      locale: { type: "string" },
      timeZone: { type: "string" },
      visibility: { type: "string", enum: ["private", "followers", "public"] },
    },
  },
  UpdateProfileRequest: {
    type: "object",
    properties: {
      displayName: { type: "string" },
      bio: { type: "string", maxLength: 500 },
      avatarId: { type: "string", format: "uuid" },
    },
  },
  UpdatePreferencesRequest: {
    type: "object",
    properties: {
      measurementSystem: { type: "string", enum: ["metric", "imperial", "mixed"] },
      locale: { type: "string" },
      timeZone: { type: "string" },
      visibility: { type: "string", enum: ["private", "followers", "public"] },
    },
  },
  Exercise: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string" },
      ownerId: { type: "string", format: "uuid", nullable: true },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      visibility: { type: "string", enum: ["private", "public"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "visibility", "createdAt"],
  },
  ExerciseUpsertRequest: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      visibility: { type: "string", enum: ["private", "public"] },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      muscleGroups: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["name", "visibility"],
  },
  ExerciseListResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Exercise" },
      },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
        },
      },
    },
    required: ["data", "meta"],
  },
  SessionStatus: {
    type: "string",
    enum: ["planned", "in_progress", "completed", "canceled"],
  },
  Session: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      planId: { type: "string", format: "uuid", nullable: true },
      status: { $ref: "#/components/schemas/SessionStatus" },
      scheduledAt: { type: "string", format: "date-time" },
      completedAt: { type: "string", format: "date-time", nullable: true },
      notes: { type: "string" },
      visibility: { type: "string", enum: ["private", "followers", "public"] },
    },
    required: ["id", "status", "scheduledAt"],
  },
  SessionCreateRequest: {
    type: "object",
    properties: {
      planId: { type: "string", format: "uuid", nullable: true },
      scheduledAt: { type: "string", format: "date-time" },
      visibility: { type: "string", enum: ["private", "followers", "public"] },
      exercises: {
        type: "array",
        items: { $ref: "#/components/schemas/SessionExerciseInput" },
      },
    },
    required: ["scheduledAt", "visibility"],
  },
  SessionExerciseInput: {
    type: "object",
    properties: {
      exerciseId: { type: "string", format: "uuid" },
      sets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            reps: { type: "integer", minimum: 1 },
            weight: { type: "number", minimum: 0 },
            rpe: { type: "number", minimum: 1, maximum: 10 },
          },
          required: ["reps"],
        },
      },
    },
    required: ["exerciseId", "sets"],
  },
  SessionListResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Session" },
      },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
        },
      },
    },
    required: ["data", "meta"],
  },
  SessionCompleteRequest: {
    type: "object",
    properties: {
      perceivedEffort: { type: "integer", minimum: 1, maximum: 10 },
      notes: { type: "string" },
    },
  },
};

const spec = {
  openapi: "3.1.0",
  info,
  servers: [
    { url: "https://api.fitvibe.app/api/v1", description: "Production" },
    { url: "https://staging.fitvibe.app/api/v1", description: "Staging" },
    { url: "http://localhost:4100/api/v1", description: "Local" },
  ],
  tags: [
    { name: "Auth", description: "Authentication & session management" },
    { name: "Users", description: "User and profile endpoints" },
    { name: "Exercises", description: "Exercise catalog endpoints" },
    { name: "Sessions", description: "Planning and workout sessions" },
    { name: "System", description: "Operational endpoints" },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas,
  },
};

function writeSpec() {
  const outputDir = resolve(process.cwd(), "openapi");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = resolve(outputDir, "openapi.json");
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`OpenAPI specification written to ${outputPath}`);
}

writeSpec();
