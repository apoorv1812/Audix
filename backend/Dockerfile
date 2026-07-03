# Use official Node.js image
FROM node:20-alpine

# Install FFmpeg which is required for the backend
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
