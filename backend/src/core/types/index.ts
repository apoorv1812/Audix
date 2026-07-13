export type ProviderStatus = 'SUCCESS' | 'NOT_CONFIGURED' | 'UNIDENTIFIED' | 'ERROR' | 'UNSUPPORTED_PROVIDER' | 'PROVIDER_UNAVAILABLE' | 'TIMEOUT' | 'PENDING' | 'NOT_SUPPORTED';

export interface BaseResult {
  status: ProviderStatus;
  provider?: string;
  confidence?: number;
  processingTime?: number;
  tokensUsed?: number;
  reason?: string;
  error?: string;
  model?: string;
  requestId?: string;
  message?: string;
}

export interface PipelineContext {
  videoPath: string;
  audioPath: string;
  framePaths: string[];
  metadata?: any;
  // Shared state that providers might need
  state: {
    movie?: MovieResult;
    music?: SongResult;
    speech?: TranscriptResult;
    ocr?: OCRResult;
    movieMetadata?: MovieMetadataResult;
  };
}

export interface AnalysisResult {
  song: SongResult | null;
  movie: MovieResult | null;
  transcript: TranscriptResult | null;
  summary: SummaryResult | null;
  ocr: OCRResult | null;
}

export interface SongResult extends BaseResult {
  title?: string;
  artist?: string;
  album?: string;
  releaseYear?: string;
  genre?: string;
  provider?: string;
}

export interface MovieMetadataResult extends BaseResult {
  imdbRating?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  runtime?: string;
  releaseYear?: string;
  poster?: string;
  network?: string;
  officialUrl?: string;
  providerName?: string;
}

export interface MovieResult extends BaseResult {
  title?: string;
  type?: 'Movie' | 'TV Show' | 'Anime' | 'Web Series' | 'Documentary';
  provider?: string;
  metadata?: MovieMetadataResult;
}

export interface TranscriptResult extends BaseResult {
  dialogue?: string;
  language?: string;
  speakerCount?: number;
}

export interface SummaryResult extends BaseResult {
  text?: string;
}

export interface OCRResult extends BaseResult {
  text?: string;
}
