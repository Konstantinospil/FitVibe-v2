import { Router } from "express";
import {
  me,
  list,
  getById,
  updateMe,
  changePassword,
  deleteAccount,
  exportData,
  listUserContacts,
  updateEmail,
  updatePhone,
  requestContactVerificationHandler,
  verifyContactHandler,
  removeContactHandler,
  adminChangeStatus,
  adminCreateUser,
} from "./users.controller.js";
import { requireAuth } from "./users.middleware.js";
import { requireRole } from "../common/rbac.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import { usersAvatarRouter } from "./users.avatar.routes.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const usersRouter = Router();

usersRouter.use(usersAvatarRouter);

usersRouter.get("/me", rateLimit("user_me", 60, 60), requireAuth, asyncHandler(me));
usersRouter.patch("/me", rateLimit("user_update", 20, 60), requireAuth, asyncHandler(updateMe));
usersRouter.post(
  "/change-password",
  rateLimit("user_pw", 10, 60),
  requireAuth,
  asyncHandler(changePassword),
);
usersRouter.delete(
  "/me",
  rateLimit("user_delete", 10, 60),
  requireAuth,
  asyncHandler(deleteAccount),
);
usersRouter.get(
  "/me/contacts",
  rateLimit("user_contacts_get", 20, 60),
  requireAuth,
  asyncHandler(listUserContacts),
);
usersRouter.put(
  "/me/contacts/email",
  rateLimit("user_contacts_email", 10, 300),
  requireAuth,
  asyncHandler(updateEmail),
);
usersRouter.put(
  "/me/contacts/phone",
  rateLimit("user_contacts_phone", 10, 300),
  requireAuth,
  asyncHandler(updatePhone),
);
usersRouter.post(
  "/me/contacts/:contactId/request-verification",
  rateLimit("user_contacts_verify_request", 5, 300),
  requireAuth,
  asyncHandler(requestContactVerificationHandler),
);
usersRouter.post(
  "/me/contacts/:contactId/verify",
  rateLimit("user_contacts_verify", 10, 300),
  requireAuth,
  asyncHandler(verifyContactHandler),
);
usersRouter.delete(
  "/me/contacts/:contactId",
  rateLimit("user_contacts_delete", 10, 300),
  requireAuth,
  asyncHandler(removeContactHandler),
);
usersRouter.post(
  "/",
  rateLimit("user_create", 5, 60),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminCreateUser),
);
usersRouter.get(
  "/",
  rateLimit("user_list", 10, 60),
  requireAuth,
  requireRole("admin"),
  asyncHandler(list),
);
usersRouter.get(
  "/me/export",
  requireAuth,
  rateLimit("user_export", 2, 3600),
  asyncHandler(exportData),
);
usersRouter.patch(
  "/:id/status",
  rateLimit("user_status", 10, 60),
  requireAuth,
  requireRole("admin"),
  asyncHandler(adminChangeStatus),
);
usersRouter.get("/:id", requireAuth, requireRole("admin"), asyncHandler(getById));
