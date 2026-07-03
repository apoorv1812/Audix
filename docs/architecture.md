# Audix Architecture

## Overview

Audix is a full-stack monorepo application structured into `frontend` and `backend` directories.

## Backend (Node.js + Express)

- **Express Server:** Handles HTTP requests and CORS.
- **Multer Middleware:** Manages multipart/form-data video uploads, temporarily storing them.
- **PipelineService:** Orchestrates the processing.
- **FFmpegService:** Extracts audio tracks and specific frames from the video.
- **Providers:** 
  - `SongRecognitionProvider`: Interfaces with a music recognition API.
  - `MovieRecognitionProvider`: Interfaces with vision APIs and movie databases.
  - `SpeechRecognitionProvider`: Interfaces with a speech-to-text API.
  - `VisionRecognitionProvider`: Interfaces with a vision AI model.
  - `SummaryProvider`: Interfaces with an LLM to generate a summary.
  
All providers implement graceful degradation: if an API key is missing, they catch the error, log a warning, and allow the pipeline to continue without that specific data point.

## Frontend (React + Vite)

- **Framework:** React 18 with Vite for fast HMR.
- **Styling:** Tailwind CSS + Framer Motion for animations.
- **State:** React Query for API data fetching and caching.
- **Architecture:** Component-driven, with specific glassmorphism UI cards for results.
