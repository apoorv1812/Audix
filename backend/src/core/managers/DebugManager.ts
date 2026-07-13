export interface DebugRun {
  timestamp: Date;
  uploadedFilename: string;
  videoMetadata: any;
  extractedAudioPath: string;
  extractedFramePaths: string[];
  providerOutputs: any;
  pipelineTimings: any;
  temporaryDirectory: string;
  cacheHit: boolean;
  errors: any[];
}

class DebugManager {
  private latestRun: DebugRun | null = null;

  setLatestRun(run: DebugRun) {
    this.latestRun = run;
  }

  getLatestRun(): DebugRun | null {
    return this.latestRun;
  }
}

export const debugManager = new DebugManager();
