type LogLevel = 'info' | 'error' | 'warn' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL as LogLevel];
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

function formatData(data: any): string {
  if (data instanceof Error) {
    return `${data.name}: ${data.message}\n${data.stack}`;
  }
  
  try {
    return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
  } catch (error) {
    return '[Unserializable data]';
  }
}

export const logger = {
  info: (context: string, message: string, data?: any) => {
    if (shouldLog('info')) {
      console.log(formatMessage(context, message), data ? formatData(data) : '');
    }
  },
  
  error: (context: string, message: string, error?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage(context, message), error ? formatData(error) : '');
    }
  },
  
  warn: (context: string, message: string, data?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage(context, message), data ? formatData(data) : '');
    }
  },
  
  debug: (context: string, message: string, data?: any) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage(context, message), data ? formatData(data) : '');
    }
  }
};