/**
 * 全局 Logger 类，统一管理日志输出
 * 支持自定义 logger 和默认 console 输出
 */

import { ILogger } from './types'

/**
 * 全局 Logger 单例类
 */
class GlobalLogger {
  private static instance: GlobalLogger
  private customLogger: ILogger | null = null

  private constructor() {}

  /**
   * 获取 Logger 单例实例
   */
  public static getInstance(): GlobalLogger {
    if (!GlobalLogger.instance) {
      GlobalLogger.instance = new GlobalLogger()
    }
    return GlobalLogger.instance
  }

  /**
   * 设置自定义 logger
   * @param logger 自定义 logger 实例
   */
  public setLogger(logger: ILogger | null): void {
    this.customLogger = logger
  }

  /**
   * 获取当前使用的 logger
   */
  private getLogger(): ILogger {
    return (
      this.customLogger || {
        log: (msg: any) => console.log(msg),
        info: (msg: any) => console.info(msg),
        error: (msg: any) => console.error(msg),
        warn: (msg: any) => console.warn(msg),
      }
    )
  }

  /**
   * 输出普通日志
   */
  public log(msg: any): void {
    this.getLogger().log(msg)
  }

  /**
   * 输出信息日志
   */
  public info(msg: any): void {
    this.getLogger().info(msg)
  }

  /**
   * 输出错误日志
   */
  public error(msg: any): void {
    this.getLogger().error(msg)
  }

  /**
   * 输出警告日志
   */
  public warn(msg: any): void {
    this.getLogger().warn(msg)
  }
}

// 导出全局 Logger 实例
export const logger = GlobalLogger.getInstance()

// 导出类型，方便其他模块使用
export { GlobalLogger }
