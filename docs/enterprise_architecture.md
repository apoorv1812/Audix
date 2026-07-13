# Audix Enterprise Architecture

## High-Level Architecture

```mermaid
graph TD
    Client[Client Browser] -->|POST /api/analyze| Controller[Analyze Controller]
    Controller -->|Check Hash| Repo[Analysis Repository]
    Repo -- Cache Hit --> Client
    Controller -- Cache Miss --> Queue[Processing Manager]
    Queue --> Pipeline[Pipeline Service]
    Pipeline --> FFMPEG[FFmpeg Service]
    FFMPEG -->|Extracts Frames, Audio, Meta| ProviderMgr[Provider Manager]
    
    subgraph Tier 1: Parallel Processing
        ProviderMgr --> Movie[Movie Provider]
        ProviderMgr --> Speech[Speech Provider]
        ProviderMgr --> OCR[OCR Provider]
        ProviderMgr --> Music[Music Provider]
    end
    
    subgraph Tier 2: Metadata
        Movie --> Metadata[Metadata Provider]
    end
    
    subgraph Tier 3: Context
        Movie --> Summary[Summary Provider]
        Speech --> Summary
        OCR --> Summary
        Music --> Summary
        Metadata --> Summary
    end
    
    Summary -->|Aggregated Result| Controller
    Controller -->|Save Hash| Repo
    Controller -->|Response| Client
```

## Provider Dependency Graph

```mermaid
stateDiagram-v2
    state "Tier 1: Parallel Execution" as T1 {
        MovieRecognition
        SpeechRecognition
        OCRRecognition
        MusicRecognition
    }
    
    state "Tier 2: Metadata" as T2 {
        MetadataProvider
    }
    
    state "Tier 3: Synthesis" as T3 {
        SummaryProvider
    }
    
    T1 --> T2: Movie Title & Type
    T1 --> T3: Features
    T2 --> T3: Enriched Metadata
```

## Folder Structure (Backend)
```
backend/src/
├── config/
├── controllers/
│   ├── analyzeController.ts   # Main entry point for video analysis
│   └── systemController.ts    # Health, metrics, and version endpoints
├── core/
│   ├── interfaces/
│   │   └── IProvider.ts       # Base contract for all AI providers
│   ├── managers/
│   │   ├── ProcessingManager.ts # Queue & concurrency management
│   │   └── ProviderManager.ts   # Provider orchestration and tiering
│   ├── repositories/
│   │   └── AnalysisRepository.ts # Database-ready storage layer
│   └── types/
│       └── index.ts           # Shared DTOs and pipeline state
├── middleware/
├── providers/                 # Isolated AI implementations
│   ├── Metadata/
│   ├── Movie/
│   ├── Music/
│   ├── OCR/
│   ├── Speech/
│   └── Summary/
├── routes/
├── services/
│   ├── ffmpegService.ts       # Optimized single-pass extraction
│   └── pipelineService.ts     # Orchestrates FFmpeg -> AI Pipeline
└── utils/
```

## Performance Benchmark Estimate

| Phase | Previous Architecture | New Enterprise Architecture |
|---|---|---|
| FFmpeg Extraction | ~2s (Multiple passes) | ~0.5s (Single pass) |
| Core AI Inference | ~15s (Monolithic call) | ~2.5s (Parallel specialized providers) |
| Metadata Fetch | ~0.5s | ~0.5s |
| Summary Generation | ~2s | ~1.5s |
| **Total Latency** | **>15s (Often Timed Out)** | **~3-5 seconds** |

## Roadmap to Millions of Analyses

1. **Database Migration**: Replace the in-memory `AnalysisRepository` with Prisma + PostgreSQL to persist data across instances.
2. **Distributed Queue**: Replace the in-memory `ProcessingManager` with Redis + BullMQ to support horizontal scaling across multiple worker nodes.
3. **Cloud Storage**: Upload extracted frames and audio to AWS S3 directly from FFmpeg, and pass signed URLs to providers to reduce memory bloat on the Node.js server.
4. **Serverless Providers**: Move computationally heavy providers (like Speech or custom Vision models) to independent serverless functions or GPU-backed microservices (e.g., Python FastAPI on runpod).
5. **WebSockets**: Introduce WebSocket communication for real-time progress updates instead of long-polling HTTP requests.
