/**
 * Logger Centralizado
 * Registra todas as operações, erros e eventos do sistema
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  error?: string;
  stack?: string;
  data?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, module, message, error, data } = entry;
    const levelUpper = level.toUpperCase().padEnd(5);
    const moduleStr = `[${module}]`.padEnd(20);
    
    let output = `${timestamp} ${levelUpper} ${moduleStr} ${message}`;
    
    if (error) {
      output += `\n  Error: ${error}`;
    }
    if (data && Object.keys(data).length > 0) {
      output += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    return output;
  }

  private log(level: LogLevel, module: string, message: string, error?: Error | string, data?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      error: typeof error === 'string' ? error : error?.message,
      stack: error instanceof Error ? error.stack : undefined,
      data,
    };

    // Manter em memória (últimas 1000 linhas)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Imprimir no console
    const formatted = this.formatLog(entry);
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(module: string, message: string, data?: Record<string, any>) {
    this.log('debug', module, message, undefined, data);
  }

  info(module: string, message: string, data?: Record<string, any>) {
    this.log('info', module, message, undefined, data);
  }

  warn(module: string, message: string, error?: Error | string, data?: Record<string, any>) {
    this.log('warn', module, message, error, data);
  }

  error(module: string, message: string, error?: Error | string, data?: Record<string, any>) {
    this.log('error', module, message, error, data);
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.slice(-limit);
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
