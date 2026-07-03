# Audix API Documentation

## `POST /api/analyze`

Analyzes an uploaded video file to extract information such as songs, movies, dialogue, and scenes.

### Request

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `video`: The video file to analyze (supported: .mp4, .mov, .avi, .mkv, .webm; max 500MB)

### Responses

#### `200 OK`

```json
{
  "success": true,
  "message": "Video analyzed successfully.",
  "data": {
    "song": {
      "title": "Mountains",
      "artist": "Hans Zimmer",
      "album": "Interstellar OST",
      "releaseYear": "2014",
      "genre": "Soundtrack",
      "confidence": 98,
      "artwork": "https://example.com/artwork.jpg",
      "streamingLinks": {
        "spotify": "https://spotify.com/...",
        "youtube": "https://youtube.com/..."
      }
    },
    "movie": null,
    "transcript": null,
    "summary": null,
    "technicalDetails": {
      "processingTimeMs": 2500,
      "extractedFrames": 5,
      "audioDurationSeconds": 15,
      "apiProvidersUsed": ["SongRecognitionProvider"]
    }
  }
}
```

#### `400 Bad Request`

```json
{
  "error": "No video file provided."
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "error": "An error occurred during processing."
}
```
