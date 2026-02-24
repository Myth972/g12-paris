/**
 * Structured logger for server-side logging
 * Provides consistent formatting and levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: any;
}

const LOG_LEVEL = process.env.LOG_LEVEL
  ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO
  : LogLevel.INFO;

function formatLog(entry: LogEntry): string {
  const { timestamp, level, context, message, data } = entry;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] [${context}] ${message}${dataStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return level >= LOG_LEVEL;
}

export const logger = {
  debug(context: string, message: string, data?: any) {
    if (!shouldLog(LogLevel.DEBUG)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      context,
      message,
      data,
    };
    console.debug(formatLog(entry));
  },

  info(context: string, message: string, data?: any) {
    if (!shouldLog(LogLevel.INFO)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context,
      message,
      data,
    };
    console.log(formatLog(entry));
  },

  warn(context: string, message: string, data?: any) {
    if (!shouldLog(LogLevel.WARN)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      context,
      message,
      data,
    };
    console.warn(formatLog(entry));
  },

  error(context: string, message: string, data?: any) {
    if (!shouldLog(LogLevel.ERROR)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context,
      message,
      data,
    };
    console.error(formatLog(entry));
  },
};
