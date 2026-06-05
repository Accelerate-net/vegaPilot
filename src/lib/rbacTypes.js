// JSDoc typedefs for the RBAC domain. Pure documentation — no runtime code.
// Import for editor hints with: /** @type {import('../lib/rbacTypes').Role} */

/**
 * A single permission as returned by the catalogue endpoints.
 * @typedef {Object} Permission
 * @property {number} id
 * @property {string} key            e.g. "orders.refund"
 * @property {string} label          e.g. "Refund Order"
 * @property {string} module         e.g. "commerce"
 * @property {string} page           e.g. "orders" or "orders.invoice"
 * @property {string} action         e.g. "view" | "edit" | "delete" | "refund" | ...
 * @property {boolean} is_high_risk
 * @property {?string} description
 */

/**
 * One page bucket inside a module in the permissions tree.
 * @typedef {Object} PermissionTreePage
 * @property {string} page
 * @property {Permission[]} permissions
 */

/**
 * Top-level module grouping from GET /rbac/permissions/tree.
 * @typedef {Object} PermissionTreeModule
 * @property {string} module
 * @property {PermissionTreePage[]} pages
 */

/**
 * A role. The list endpoint omits `permissions` (only `permissionCount`);
 * GET /rbac/roles/{id} includes `permissions` as an array of permission KEYS.
 * @typedef {Object} Role
 * @property {number} id
 * @property {string} key            UPPER_SNAKE identifier, e.g. "ADMIN"
 * @property {string} label          human label, e.g. "Admin"
 * @property {?string} badge_color   "#rrggbb"
 * @property {boolean} is_system     system roles are read-only
 * @property {number} permissionCount
 * @property {string[]} [permissions] permission keys (detail endpoint only)
 */

/**
 * A role reference embedded in an admin user record.
 * @typedef {Object} UserRoleRef
 * @property {number} id
 * @property {string} name           role key
 * @property {string} label
 */

/**
 * An admin user from GET /user-account/list. Prefer the canonical `roles[]`
 * over the legacy single-role mirror (`roleId`/`roleName`/`roleLabel`).
 * @typedef {Object} AdminUser
 * @property {number} id             seq id (FE-facing)
 * @property {string} name
 * @property {string} email
 * @property {?string} mobile
 * @property {UserRoleRef[]} roles   canonical multi-role field
 * @property {?number} roleId        legacy mirror of FIRST role
 * @property {?string} roleName
 * @property {?string} roleLabel
 * @property {boolean} active
 * @property {?string} lastLogin     ISO8601 or null
 */

export {};
