type MediaPermissionContext = { canAccessAdmin: boolean; canEditDrafts: boolean; canPublish: boolean; isAdmin: boolean };

export const canViewMediaLibrary = (permissions: MediaPermissionContext) => permissions.canAccessAdmin && (permissions.isAdmin || permissions.canEditDrafts || permissions.canPublish);
export const canUploadMedia = (permissions: MediaPermissionContext) => permissions.canAccessAdmin && (permissions.isAdmin || permissions.canEditDrafts);
export const canSelectMedia = canUploadMedia;
export const canReplaceMedia = canUploadMedia;
export const canDeleteMedia = (permissions: MediaPermissionContext) => permissions.canAccessAdmin && permissions.isAdmin;
