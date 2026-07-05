export type ProviderStatus = 'SUCCESS' | 'NOT_CONFIGURED' | 'UNIDENTIFIED' | 'ERROR' | 'UNSUPPORTED_PROVIDER' | 'PROVIDER_UNAVAILABLE' | 'TIMEOUT';

export interface BaseResult {
  status: ProviderStatus;
  message?: string;
  confidence?: number;
}

export interface AnalysisResult {
  song: SongResult | null;
  movie: MovieResult | null;
  transcript: TranscriptResult | null;
  summary: SummaryResult | null;
  technicalDetails: TechnicalDetails;
}

export interface SongResult extends BaseResult {
  title?: string;
  artist?: string;
  album?: string;
  releaseYear?: string;
  genre?: string;
  artwork?: string;
  streamingLinks?: {
    spotify?: string;
    youtube?: string;
  };
}

export interface MovieMetadataResult extends BaseResult {
  imdbRating?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  runtime?: string;
  releaseYear?: string;
  poster?: string;
  synopsis?: string;
  streamingPlatforms?: string[];
  network?: string;
  officialUrl?: string;
  providerName?: string;
}

export interface MovieResult extends BaseResult {
  title?: string;
  type?: 'Movie' | 'TV Show' | 'Anime' | 'Web Series' | 'Documentary';
  sceneDescription?: string;
  objects?: string[];
  ocr?: string;
  metadata?: MovieMetadataResult;
}

export interface TranscriptResult extends BaseResult {
  dialogue?: string;
  language?: string;
}

export interface SummaryResult extends BaseResult {
  text?: string;
}

export interface TechnicalDetails {
  processingTimeMs: number;
  extractedFrames: number;
  audioDurationSeconds: number;
  apiProvidersUsed: string[];
  pipelineTimes?: Record<string, number>;
}
