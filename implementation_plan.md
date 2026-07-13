# Audix Enterprise Backend Redesign

The objective is to refactor the Audix backend from a simple monolithic AI wrapper into a production-grade, highly parallel orchestration engine with latency under 5 seconds.

## User Review Required

> [!WARNING]
> This is a complete architectural overhaul. Please review the new modular structure carefully. The `CombinedRecognitionService` (which used a single Gemini call for everything) will be removed in favor of isolated providers. Since you want to remove Gemini from music recognition, we will implement a Mock provider initially (as AudD/ACRCloud require API keys we may not have configured yet) or you can provide the specific API keys in `.env`.

## Open Questions

> [!IMPORTANT]
> 1. Do you want to provide actual API keys for AudD or ACRCloud now, or should I implement the interfaces and use a Mock provider for Music Recognition to ensure the pipeline works?
> 2. For the OCR Provider, should we use Gemini Vision or a dedicated OCR service (like Google Cloud Vision or Tesseract)?
> 3. Should the "database ready" components (like Repositories) use an in-memory map for now, or do you want me to set up Prisma/TypeORM with a PostgreSQL connection right away?

## Proposed Changes

---

### Core Domain & Types
#### [NEW] [backend/src/core/interfaces/IProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/core/interfaces/IProvider.ts)
- Base interface for all AI providers (`initialize`, `analyze`, `cleanup`, `healthCheck`, etc.)
#### [NEW] [backend/src/core/types/index.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/core/types/index.ts)
- Define `PipelineContext`, `AnalysisResult`, and structured JSON types for the API.

---

### Managers & Orchestration
#### [NEW] [backend/src/core/managers/ProviderManager.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/core/managers/ProviderManager.ts)
- Orchestrates providers. Registers available providers, handles the parallel execution of the first-stage providers (Movie, Music, Speech, OCR), waits for them, then triggers second-stage (Metadata, Summary).
#### [NEW] [backend/src/core/managers/ProcessingManager.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/core/managers/ProcessingManager.ts)
- Queue manager. Tracks active analyses, handles concurrency limits, prevents duplicate processing.

---

### Repositories (Database Ready)
#### [NEW] [backend/src/core/repositories/AnalysisRepository.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/core/repositories/AnalysisRepository.ts)
- Repository pattern interface and memory-based implementation for storing video hashes, results, dates, and durations. Ready to be swapped with PostgreSQL.

---

### Providers
#### [NEW] [backend/src/providers/Movie/GeminiMovieProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/Movie/GeminiMovieProvider.ts)
- Independent movie recognition relying ONLY on the 4 optimized frames.
#### [NEW] [backend/src/providers/Music/MockMusicProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/Music/MockMusicProvider.ts)
- Dedicated music provider interface implementation.
#### [NEW] [backend/src/providers/Speech/GeminiSpeechProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/Speech/GeminiSpeechProvider.ts)
- Transcription, language detection. No movie details.
#### [NEW] [backend/src/providers/Metadata/TVMazeMetadataProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/Metadata/TVMazeMetadataProvider.ts)
- Refactored to accept Title + Type and return exact structured data.
#### [NEW] [backend/src/providers/Summary/GeminiSummaryProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/Summary/GeminiSummaryProvider.ts)
- Consumes outputs of Movie, Music, Speech, and Metadata.
#### [NEW] [backend/src/providers/OCR/GeminiOCRProvider.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/providers/OCR/GeminiOCRProvider.ts)
- Extracts text from frames.
#### [DELETE] [backend/src/services/CombinedRecognitionService.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/services/CombinedRecognitionService.ts)
- Removing the monolithic service.

---

### Services
#### [MODIFY] [backend/src/services/ffmpegService.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/services/ffmpegService.ts)
- Extract 4 JPEG frames, mono audio at 64kbps, trim silence, normalize volume, and extract technical metadata in a single FFmpeg process.
#### [MODIFY] [backend/src/services/pipelineService.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/services/pipelineService.ts)
- Re-architected to use `ProcessingManager` and `ProviderManager`. Uses SHA-256 caching.

---

### API & Controllers
#### [MODIFY] [backend/src/controllers/analyzeController.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/controllers/analyzeController.ts)
- Integrated with the queue manager and cache.
#### [NEW] [backend/src/controllers/systemController.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/controllers/systemController.ts)
- Health, Provider status, Metrics, and Version endpoints.
#### [MODIFY] [backend/src/routes/index.ts](file:///c:/Users/APOORV/OneDrive/Desktop/Audix/backend/src/routes/index.ts)
- Map new enterprise endpoints.

## Verification Plan

### Automated Tests
- N/A for this iteration, but will ensure code builds successfully with TypeScript.

### Manual Verification
- Will start the backend locally and upload a sample video.
- Monitor console logs to verify that FFmpeg runs once.
- Verify that Movie, Music, Speech, and OCR execute entirely in parallel.
- Check that Metadata and Summary execute only after the first tier is complete.
- Confirm total latency is tracked and significantly reduced.
- Hit the new `/api/health`, `/api/metrics`, and `/api/status` endpoints to verify enterprise features.
