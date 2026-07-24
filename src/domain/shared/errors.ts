export class DomainError extends Error {
  readonly code: string;
  readonly details?: unknown;
  constructor(message: string, code = "DOMAIN_ERROR", details?: unknown) { super(message); this.name = "DomainError"; this.code = code; this.details = details; }
}
export class ValidationError extends DomainError { constructor(message: string, details?: unknown) { super(message, "VALIDATION_ERROR", details); this.name = "ValidationError"; } }
export class AuthorizationError extends DomainError { constructor(message = "You are not authorised to perform this action.") { super(message, "AUTHORIZATION_ERROR"); this.name = "AuthorizationError"; } }
export class ConflictError extends DomainError { constructor(message: string, details?: unknown) { super(message, "CONFLICT_ERROR", details); this.name = "ConflictError"; } }
export class NotFoundError extends DomainError { constructor(message = "The requested item could not be found.") { super(message, "NOT_FOUND"); this.name = "NotFoundError"; } }
export class PublicationError extends DomainError { constructor(message: string, details?: unknown) { super(message, "PUBLICATION_ERROR", details); this.name = "PublicationError"; } }
export class BackendUnavailableError extends DomainError { constructor(message = "This service is not available yet.") { super(message, "BACKEND_UNAVAILABLE"); this.name = "BackendUnavailableError"; } }
export class PermissionDeniedError extends AuthorizationError { constructor(message = "You do not have permission to perform this action.") { super(message); this.name = "PermissionDeniedError"; } }
