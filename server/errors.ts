/**
 * Centralized error handling utilities
 * Provides consistent error responses and user notifications
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

export enum AppErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  AUTH_FAILED = "AUTH_FAILED",

  // Validation
  INVALID_INPUT = "INVALID_INPUT",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Resource
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RESOURCE_EXISTS = "RESOURCE_EXISTS",

  // Database
  DATABASE_ERROR = "DATABASE_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",

  // Server
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",

  // External services
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  API_ERROR = "API_ERROR",
}

export interface AppError {
  code: AppErrorCode;
  message: string;
  userMessage?: string;
  details?: any;
  statusCode: number;
}

// Map error codes to HTTP status codes
const ERROR_STATUS_CODES: Record<AppErrorCode, number> = {
  [AppErrorCode.UNAUTHORIZED]: 401,
  [AppErrorCode.FORBIDDEN]: 403,
  [AppErrorCode.AUTH_FAILED]: 401,
  [AppErrorCode.INVALID_INPUT]: 400,
  [AppErrorCode.VALIDATION_ERROR]: 400,
  [AppErrorCode.NOT_FOUND]: 404,
  [AppErrorCode.CONFLICT]: 409,
  [AppErrorCode.RESOURCE_EXISTS]: 409,
  [AppErrorCode.DATABASE_ERROR]: 500,
  [AppErrorCode.TRANSACTION_FAILED]: 500,
  [AppErrorCode.INTERNAL_ERROR]: 500,
  [AppErrorCode.SERVICE_UNAVAILABLE]: 503,
  [AppErrorCode.TIMEOUT]: 504,
  [AppErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [AppErrorCode.API_ERROR]: 400,
};

// User-friendly error messages
const USER_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.UNAUTHORIZED]: "Vous devez vous connecter pour accéder à cette ressource.",
  [AppErrorCode.FORBIDDEN]: "Vous n'avez pas les permissions pour accéder à cette ressource.",
  [AppErrorCode.AUTH_FAILED]: "Authentification échouée. Veuillez vérifier vos identifiants.",
  [AppErrorCode.INVALID_INPUT]: "Les données envoyées sont invalides.",
  [AppErrorCode.VALIDATION_ERROR]: "Erreur de validation des données.",
  [AppErrorCode.NOT_FOUND]: "La ressource demandée n'existe pas.",
  [AppErrorCode.CONFLICT]: "Il existe déjà une ressource avec ces paramètres.",
  [AppErrorCode.RESOURCE_EXISTS]: "Cette ressource existe déjà.",
  [AppErrorCode.DATABASE_ERROR]: "Erreur de base de données. Veuillez réessayer plus tard.",
  [AppErrorCode.TRANSACTION_FAILED]: "La transaction a échoué. Veuillez réessayer.",
  [AppErrorCode.INTERNAL_ERROR]: "Une erreur interne s'est produite. Notre équipe a été notifiée.",
  [AppErrorCode.SERVICE_UNAVAILABLE]: "Le service est actuellement indisponible. Veuillez réessayer plus tard.",
  [AppErrorCode.TIMEOUT]: "La requête a expiré. Veuillez réessayer.",
  [AppErrorCode.EXTERNAL_SERVICE_ERROR]: "Un service externe est indisponible. Veuillez réessayer.",
  [AppErrorCode.API_ERROR]: "Erreur lors de la communication avec le serveur.",
};

/**
 * Create a standardized app error
 */
export function createAppError(
  code: AppErrorCode,
  message: string,
  options?: {
    userMessage?: string;
    details?: any;
  }
): AppError {
  return {
    code,
    message,
    userMessage: options?.userMessage || USER_MESSAGES[code],
    details: options?.details,
    statusCode: ERROR_STATUS_CODES[code],
  };
}

/**
 * Convert app error to tRPC error
 */
export function toTRPCError(error: AppError): TRPCError {
  const code = error.code === AppErrorCode.NOT_FOUND
    ? "NOT_FOUND"
    : error.code === AppErrorCode.UNAUTHORIZED
    ? "UNAUTHORIZED"
    : error.code === AppErrorCode.FORBIDDEN
    ? "FORBIDDEN"
    : "INTERNAL_SERVER_ERROR";

  return new TRPCError({
    code: code as any,
    message: error.userMessage || error.message,
    cause: error.details,
  });
}

/**
 * Handle and log errors consistently
 */
export function handleError(
  context: string,
  error: unknown,
  customMessage?: string
): AppError {
  let appError: AppError;

  if (error instanceof TRPCError) {
    // Already a tRPC error
    appError = createAppError(
      AppErrorCode.INTERNAL_ERROR,
      customMessage || error.message,
      { details: error.cause }
    );
  } else if (error instanceof Error) {
    // Standard JavaScript error
    appError = createAppError(
      AppErrorCode.INTERNAL_ERROR,
      customMessage || error.message,
      { details: error.stack }
    );
  } else {
    // Unknown error
    appError = createAppError(
      AppErrorCode.INTERNAL_ERROR,
      customMessage || "Unknown error occurred",
      { details: error }
    );
  }

  // Log the error
  logger.error(context, appError.message, {
    code: appError.code,
    details: appError.details,
  });

  return appError;
}

/**
 * Validation error helper
 */
export function validationError(
  field: string,
  message: string
): AppError {
  return createAppError(
    AppErrorCode.VALIDATION_ERROR,
    `Validation failed for field: ${field}`,
    {
      userMessage: message,
      details: { field },
    }
  );
}

/**
 * Not found error helper
 */
export function notFoundError(resourceType: string): AppError {
  return createAppError(
    AppErrorCode.NOT_FOUND,
    `${resourceType} not found`,
    {
      userMessage: `Le ${resourceType} demandé n'existe pas.`,
    }
  );
}

/**
 * Database error helper
 */
export function databaseError(operation: string, originalError?: Error): AppError {
  return createAppError(
    AppErrorCode.DATABASE_ERROR,
    `Database operation failed: ${operation}`,
    {
      details: originalError?.message,
    }
  );
}
