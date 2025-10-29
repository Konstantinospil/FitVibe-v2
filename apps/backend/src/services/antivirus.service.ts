/**
 * Antivirus Scanning Service (B-USR-5)
 *
 * Provides malware scanning capabilities using ClamAV.
 * Per ADR-004, all user uploads must be scanned before storage.
 *
 * @see apps/docs/6. adr/ADR-004-media-upload-safety-and-av-scanning.md
 */

import NodeClam from "clamscan";
import { Readable } from "node:stream";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

let clamavInstance: NodeClam | null = null;
let initializationPromise: Promise<NodeClam> | null = null;

/**
 * Initialize ClamAV scanner instance.
 * This is called lazily on first scan to avoid blocking server startup.
 */
async function initializeClamAV(): Promise<NodeClam> {
  if (clamavInstance) {
    return clamavInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      logger.info(
        {
          host: env.clamav.host,
          port: env.clamav.port,
          enabled: env.clamav.enabled,
        },
        "[antivirus] Initializing ClamAV scanner",
      );

      const clamscan = await new NodeClam().init({
        removeInfected: false, // We handle removal ourselves
        quarantineInfected: false, // We handle quarantine ourselves
        scanLog: null, // Don't write scan logs to file
        debugMode: env.NODE_ENV === "development",
        clamdscan: {
          host: env.clamav.host,
          port: env.clamav.port,
          timeout: env.clamav.timeout,
          localFallback: false, // Don't fallback to local scanning in production
        },
      });

      clamavInstance = clamscan;
      logger.info("[antivirus] ClamAV scanner initialized successfully");
      return clamscan;
    } catch (error) {
      initializationPromise = null; // Reset so we can retry
      logger.error({ err: error }, "[antivirus] Failed to initialize ClamAV scanner");
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Scan result interface
 */
export interface ScanResult {
  isInfected: boolean;
  viruses: string[];
  scannedAt: Date;
}

/**
 * Scan a file buffer for malware.
 *
 * @param buffer - File buffer to scan
 * @param filename - Original filename (for logging)
 * @returns Scan result with infection status and virus names
 *
 * @example
 * const result = await scanBuffer(fileBuffer, 'avatar.jpg');
 * if (result.isInfected) {
 *   throw new Error(`Malware detected: ${result.viruses.join(', ')}`);
 * }
 */
export async function scanBuffer(buffer: Buffer, filename: string = "upload"): Promise<ScanResult> {
  const startTime = Date.now();

  // If AV scanning is disabled (dev mode), return clean result
  if (!env.clamav.enabled) {
    logger.warn(
      { filename },
      "[antivirus] Scanning disabled - skipping malware check (DEVELOPMENT ONLY)",
    );
    return {
      isInfected: false,
      viruses: [],
      scannedAt: new Date(),
    };
  }

  try {
    const scanner = await initializeClamAV();

    // Convert Buffer to Stream (clamscan requires a stream)
    const stream = Readable.from(buffer);

    // Scan the stream
    const { isInfected, viruses } = await scanner.scanStream(stream);

    const scanDuration = Date.now() - startTime;

    if (isInfected) {
      logger.warn(
        {
          filename,
          viruses: viruses || [],
          size: buffer.length,
          scanDurationMs: scanDuration,
        },
        "[antivirus] MALWARE DETECTED",
      );
    } else {
      logger.debug(
        {
          filename,
          size: buffer.length,
          scanDurationMs: scanDuration,
        },
        "[antivirus] File clean",
      );
    }

    return {
      isInfected,
      viruses: viruses || [],
      scannedAt: new Date(),
    };
  } catch (error) {
    logger.error(
      {
        err: error,
        filename,
        size: buffer.length,
      },
      "[antivirus] Scan failed",
    );

    // In production, fail-closed: treat scan errors as potential threats
    if (env.isProduction) {
      return {
        isInfected: true,
        viruses: ["SCAN_ERROR"],
        scannedAt: new Date(),
      };
    }

    // In development, fail-open but log warning
    logger.warn("[antivirus] Scan error in development - allowing upload");
    return {
      isInfected: false,
      viruses: [],
      scannedAt: new Date(),
    };
  }
}

/**
 * Check if ClamAV service is healthy and ready.
 *
 * @returns true if ClamAV is responding, false otherwise
 */
export async function checkHealth(): Promise<boolean> {
  if (!env.clamav.enabled) {
    return true; // Consider healthy if disabled
  }

  try {
    const scanner = await initializeClamAV();
    const version = await scanner.getVersion();
    logger.debug({ version }, "[antivirus] Health check passed");
    return true;
  } catch (error) {
    logger.error({ err: error }, "[antivirus] Health check failed");
    return false;
  }
}

/**
 * Get ClamAV version information.
 * Useful for monitoring and debugging.
 */
export async function getVersion(): Promise<string | null> {
  if (!env.clamav.enabled) {
    return null;
  }

  try {
    const scanner = await initializeClamAV();
    return await scanner.getVersion();
  } catch (error) {
    logger.error({ err: error }, "[antivirus] Failed to get version");
    return null;
  }
}
