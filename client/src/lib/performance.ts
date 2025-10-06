/**
 * Performance Monitoring and Optimization Utilities
 *
 * This module provides tools for monitoring and optimizing application performance
 * in production environments.
 */

// Performance metrics collection
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled = true;

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      this.isEnabled = false;
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', entry.duration);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource-${resourceEntry.initiatorType}`, entry.duration);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('largest-contentful-paint', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        }
        this.recordMetric('cumulative-layout-shift', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      // Performance monitoring is not critical, silently disable
      this.isEnabled = false;
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.isEnabled) return;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements to prevent memory leaks
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Measure execution time of a function
   */
  measureFunction<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);
    return result;
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<
    string,
    {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    }
  > {
    const stats: Record<
      string,
      {
        count: number;
        min: number;
        max: number;
        avg: number;
        p50: number;
        p90: number;
        p95: number;
        p99: number;
      }
    > = {};

    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      stats[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return stats;
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): Record<string, number | null> {
    const stats = this.getStats();

    return {
      // Largest Contentful Paint (should be < 2.5s)
      lcp: stats['largest-contentful-paint']?.p90 || null,

      // First Input Delay (should be < 100ms)
      fid: stats['first-input-delay']?.p90 || null,

      // Cumulative Layout Shift (should be < 0.1)
      cls: stats['cumulative-layout-shift']?.max || null,

      // First Contentful Paint (should be < 1.8s)
      fcp: stats['first-contentful-paint']?.avg || null,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  private isEnabled = true;

  constructor() {
    this.isEnabled = 'memory' in performance;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): Record<string, number> | null {
    const performanceWithMemory = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if (!this.isEnabled || !performanceWithMemory.memory) {
      return null;
    }

    const memory = performanceWithMemory.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  /**
   * Check if memory usage is high
   */
  isMemoryUsageHigh(threshold = 80): boolean {
    const usage = this.getMemoryUsage();
    return usage ? usage.usedPercent > threshold : false;
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  /**
   * Analyze loaded resources
   */
  analyzeResources(): {
    totalSize: number;
    totalCount: number;
    byType: Record<
      string,
      { count: number; size: number; resources: Array<{ name: string; size: number; duration: number }> }
    >;
    largestResources: Array<{ name: string; size: number; type: string; duration: number }>;
  } {
    if (typeof window === 'undefined' || !window.performance) {
      return {
        totalSize: 0,
        totalCount: 0,
        byType: {},
        largestResources: [],
      };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const analysis = {
      totalSize: 0,
      totalCount: 0,
      byType: {} as Record<
        string,
        { count: number; size: number; resources: Array<{ name: string; size: number; duration: number }> }
      >,
      largestResources: [] as Array<{ name: string; size: number; type: string; duration: number }>,
    };

    const resourcesByType: Record<
      string,
      { count: number; size: number; resources: Array<{ name: string; size: number; duration: number }> }
    > = {};

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      const type = resource.initiatorType || 'other';

      analysis.totalSize += size;
      analysis.totalCount++;

      if (!resourcesByType[type]) {
        resourcesByType[type] = { count: 0, size: 0, resources: [] };
      }

      resourcesByType[type].count++;
      resourcesByType[type].size += size;
      resourcesByType[type].resources.push({
        name: resource.name,
        size,
        duration: resource.duration,
      });
    });

    analysis.byType = resourcesByType;

    // Find largest resources
    analysis.largestResources = resources
      .map((r) => ({
        name: r.name,
        size: r.transferSize || 0,
        type: r.initiatorType,
        duration: r.duration,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return analysis;
  }

  /**
   * Get recommendations for optimization
   */
  getOptimizationRecommendations(): string[] {
    const analysis = this.analyzeResources();
    const recommendations: string[] = [];

    // Check for large JavaScript bundles
    if (analysis.byType?.script?.size > 1024 * 1024) {
      // > 1MB
      recommendations.push('Consider code splitting to reduce JavaScript bundle size');
    }

    // Check for unoptimized images
    if (analysis.byType?.img?.size > 2 * 1024 * 1024) {
      // > 2MB
      recommendations.push('Optimize images using modern formats (WebP, AVIF) and compression');
    }

    // Check for too many requests
    if (analysis.totalCount > 100) {
      recommendations.push('Consider bundling resources to reduce the number of HTTP requests');
    }

    // Check for large CSS
    if (analysis.byType?.css?.size > 512 * 1024) {
      // > 512KB
      recommendations.push('Consider CSS code splitting and removing unused styles');
    }

    return recommendations;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();
export const bundleAnalyzer = new BundleAnalyzer();

// React hook for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const measureRender = (fn: () => void) => {
    performanceMonitor.measureFunction(`${componentName}-render`, fn);
  };

  const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(`${componentName}-${name}`, fn);
  };

  const getComponentStats = () => {
    const stats = performanceMonitor.getStats();
    return Object.keys(stats)
      .filter((key) => key.startsWith(componentName))
      .reduce(
        (acc, key) => {
          acc[key] = stats[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );
  };

  return {
    measureRender,
    measureAsync,
    getComponentStats,
  };
};

// Performance reporting utility
export const reportPerformanceMetrics = () => {
  const stats = performanceMonitor.getStats();
  const coreWebVitals = performanceMonitor.getCoreWebVitals();
  const memoryUsage = memoryMonitor.getMemoryUsage();
  const bundleAnalysis = bundleAnalyzer.analyzeResources();

  const report = {
    timestamp: new Date().toISOString(),
    coreWebVitals,
    memoryUsage,
    performanceStats: stats,
    bundleAnalysis,
    recommendations: bundleAnalyzer.getOptimizationRecommendations(),
  };

  // In production, this would be sent to analytics service
  // For now, just return the report without logging
  return report;
};
