/**
 * Type declarations for clamscan package
 * @see https://github.com/kylefarris/clamscan
 */

declare module "clamscan" {
  export interface ClamScanOptions {
    removeInfected?: boolean;
    quarantineInfected?: boolean | string;
    scanLog?: string | null;
    debugMode?: boolean;
    fileList?: string | null;
    scanRecursively?: boolean;
    clamscan?: {
      path?: string;
      db?: string;
      scanArchives?: boolean;
      active?: boolean;
    };
    clamdscan?: {
      socket?: string | boolean;
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
      path?: string;
      configFile?: string;
      multiscan?: boolean;
      reloadDb?: boolean;
      active?: boolean;
      bypassTest?: boolean;
    };
    preference?: string;
  }

  export interface ScanResult {
    isInfected: boolean;
    viruses: string[];
    file?: string;
  }

  export default class NodeClam {
    constructor();

    init(options?: ClamScanOptions): Promise<NodeClam>;

    scanStream(stream: Buffer | NodeJS.ReadableStream): Promise<ScanResult>;

    scanFile(path: string): Promise<ScanResult>;

    scanFiles(paths: string[]): Promise<{ [key: string]: ScanResult }>;

    scanDir(path: string): Promise<{ [key: string]: ScanResult }>;

    getVersion(): Promise<string>;

    isInfected(file: string): Promise<boolean>;

    passthrough(): NodeJS.ReadWriteStream;
  }
}
