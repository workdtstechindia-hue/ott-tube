/* =========================
   ROLE CONSTANTS
========================= */
export const ROLES = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  SUPPORT: "support",
};

/* =========================
   PERMISSIONS CONFIG
========================= */

export const PERMISSIONS = {
  MOVIE_MANAGE: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  USER_MANAGE: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  PURCHASE_VIEW: [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.SUPPORT,
  ],
  DASHBOARD_VIEW: [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.SUPPORT,
  ],
};


/* =========================
   PAYMENT STATUS
========================= */
export const PAYMENT_STATUS = {
  PAID: "paid",
  PENDING: "pending",
};

/* =========================
   STATUS COLORS
========================= */
export const STATUS_COLORS = {
  paid: "success",
  pending: "warning",
  failed: "danger",
};

/* =========================
   API ENDPOINTS
========================= */
export const API_ENDPOINTS = {
  AUTH: {
    ADMIN_LOGIN: "/api/auth/admin/login",
  },
  ADMIN: {
    DASHBOARD_OVERVIEW:
      "/api/admin/dashboard/overview",
    MOVIES: "/api/admin/movies",
    USERS: "/api/admin/users",
    PURCHASES: "/api/admin/purchases",
  },
};

/* =========================
   PAGINATION DEFAULTS
========================= */
export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 8,
};
