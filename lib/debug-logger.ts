/**
 * Debug logging utilities with environment-based gating
 * Gates verbose logging behind debug flags for production clarity
 */

// Environment variables for debug control
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG_ENABLED = process.env.DEBUG === 'true' || IS_DEVELOPMENT;
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_DEVELOPMENT ? 'debug' : 'error');

// Log levels in order of severity
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  'debug': LogLevel.DEBUG,
  'info': LogLevel.INFO,
  'warn': LogLevel.WARN,
  'error': LogLevel.ERROR,
  'none': LogLevel.NONE,
};

const currentLogLevel = LOG_LEVEL_MAP[LOG_LEVEL.toLowerCase()] ?? LogLevel.ERROR;

/**
 * Enhanced logger with debug gating and structured output
 */
export class Logger {
  private component: string;

  constructor(component: string = 'APP') {
    this.component = component;
  }

  /**
   * Debug level logging - only shown in development or when DEBUG=true
   */
  debug(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.DEBUG && DEBUG_ENABLED) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${this.component}] [DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Info level logging - shown unless LOG_LEVEL is warn/error
   */
  info(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.INFO) {
      const timestamp = new Date().toISOString();
      console.info(`[${timestamp}] [${this.component}] [INFO] ${message}`, data || '');
    }
  }

  /**
   * Warning level logging - shown unless LOG_LEVEL is error
   */
  warn(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.WARN) {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [${this.component}] [WARN] ${message}`, data || '');
    }
  }

  /**
   * Error level logging - always shown unless LOG_LEVEL is none
   */
  error(message: string, error?: any): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [${this.component}] [ERROR] ${message}`, error || '');
    }
  }

  /**
   * Performance logging - only in debug mode
   */
  perf(message: string, duration?: number): void {
    if (DEBUG_ENABLED && currentLogLevel <= LogLevel.DEBUG) {
      const timestamp = new Date().toISOString();
      const durationMsg = duration ? ` (${duration}ms)` : '';
      console.log(`[${timestamp}] [${this.component}] [PERF] ${message}${durationMsg}`);
    }
  }

  /**
   * Memory usage logging - only in debug mode
   */
  memory(message: string, memoryUsage?: NodeJS.MemoryUsage): void {
    if (DEBUG_ENABLED && currentLogLevel <= LogLevel.DEBUG && typeof process !== 'undefined') {
      const timestamp = new Date().toISOString();
      const usage = memoryUsage || process.memoryUsage();
      const memoryMB = {
        rss: Math.round(usage.rss / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      };
      console.log(`[${timestamp}] [${this.component}] [MEMORY] ${message}`, memoryMB);
    }
  }

  /**
   * Network logging - only in debug mode
   */
  network(message: string, details?: any): void {
    if (DEBUG_ENABLED && currentLogLevel <= LogLevel.DEBUG) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${this.component}] [NETWORK] ${message}`, details || '');
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger('DEFAULT');

/**
 * Create a component-specific logger
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: Logger;
  private label: string;

  constructor(label: string, logger?: Logger) {
    this.label = label;
    this.logger = logger || new Logger('PERF');
    this.startTime = performance.now();
  }

  /**
   * End the timer and log the duration
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    this.logger.perf(`${this.label} completed`, duration);
    return duration;
  }
}

/**
 * Conditional logging that only executes in debug mode
 */
export function debugOnly(fn: () => void): void {
  if (DEBUG_ENABLED && currentLogLevel <= LogLevel.DEBUG) {
    fn();
  }
}

/**
 * Rate-limited logging to prevent spam
 */
export class RateLimitedLogger {
  private lastLog = new Map<string, number>();
  private logger: Logger;
  private intervalMs: number;

  constructor(logger: Logger, intervalMs: number = 5000) {
    this.logger = logger;
    this.intervalMs = intervalMs;
  }

  log(key: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const now = Date.now();
    const lastTime = this.lastLog.get(key) || 0;

    if (now - lastTime >= this.intervalMs) {
      this.logger[level](message, data);
      this.lastLog.set(key, now);
    }
  }
}

/**
 * Environment configuration helpers
 */
export const DebugConfig = {
  isDebugEnabled: () => DEBUG_ENABLED,
  isDevelopment: () => IS_DEVELOPMENT,
  getLogLevel: () => LOG_LEVEL,
  shouldLog: (level: string) => {
    const targetLevel = LOG_LEVEL_MAP[level.toLowerCase()];
    return targetLevel !== undefined && currentLogLevel <= targetLevel;
  },
} as const;