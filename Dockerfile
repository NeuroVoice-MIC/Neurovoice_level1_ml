FROM python:3.10-slim

# Install system dependencies for Praat
RUN apt-get update && apt-get install -y \
    praat \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r python/requirements.txt

# Install Node
RUN apt-get update && apt-get install -y nodejs npm

# Install Node dependencies
RUN cd node && npm install

# Expose Render port
EXPOSE 10000

# Start Node server
CMD ["sh", "-c", "cd node && node server.js"]
