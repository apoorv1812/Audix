# Audix - AI Video Recognition Platform

"Discover Everything Inside Your Video."

Audix intelligently analyzes uploaded videos to identify songs, movies, TV shows, dialogue, and more.

## Features
- **Song Recognition:** Identifies music playing in the video.
- **Movie/TV Show Recognition:** Identifies the visual content.
- **Transcription:** Extracts dialogue from the video.
- **AI Summary:** Provides a brief contextual summary.

## Running Locally (Docker)

Ensure Docker and Docker Compose are installed.

1. Clone the repository.
2. Create a `.env` file based on `.env.example`.
3. Run the application:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:3000` and backend at `http://localhost:3001`.

## Structure
- `/frontend`: React + Vite + Tailwind CSS + Framer Motion
- `/backend`: Node.js + Express + FFmpeg
- `/docs`: Technical documentation
