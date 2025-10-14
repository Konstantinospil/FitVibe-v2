import { Router } from "express";
import {
  me,
  list,
  getById,
  updateMe,
  changePassword,
  deactivateAccount,
  exportData,
  listUserContacts,
  updateEmail,
  updatePhone,
  verifyContactHandler,
  removeContactHandler,
  adminChangeStatus,
} from "./users.controller.js";
import { requireAuth } from "./users.middleware.js";
import { requireRole } from "../common/rbac.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import { usersAvatarRouter } from "./users.avatar.routes.js";

export const usersRouter = Router();

usersRouter.use(usersAvatarRouter);

usersRouter.get("/me", rateLimit("user_me", 60, 60), requireAuth, me);
usersRouter.patch("/me", rateLimit("user_update", 20, 60), requireAuth, updateMe);
usersRouter.post("/change-password", rateLimit("user_pw", 10, 60), requireAuth, changePassword);
usersRouter.delete("/me", rateLimit("user_delete", 10, 60), requireAuth, deactivateAccount);
usersRouter.get("/me/contacts", rateLimit("user_contacts_get", 20, 60), requireAuth, listUserContacts);
usersRouter.put("/me/contacts/email", rateLimit("user_contacts_email", 10, 300), requireAuth, updateEmail);
usersRouter.put("/me/contacts/phone", rateLimit("user_contacts_phone", 10, 300), requireAuth, updatePhone);
usersRouter.post(
  "/me/contacts/:contactId/verify",
  rateLimit("user_contacts_verify", 10, 300),
  requireAuth,
  verifyContactHandler,
);
usersRouter.delete(
  "/me/contacts/:contactId",
  rateLimit("user_contacts_delete", 10, 300),
  requireAuth,
  removeContactHandler,
);
usersRouter.get("/", rateLimit("user_list", 10, 60), requireAuth, requireRole("admin"), list);
usersRouter.get("/me/export", requireAuth, rateLimit("user_export", 2, 3600), exportData);
usersRouter.patch(
  "/:id/status",
  rateLimit("user_status", 10, 60),
  requireAuth,
  requireRole("admin"),
  adminChangeStatus,
);
usersRouter.get("/:id", requireAuth, requireRole("admin"), getById);
