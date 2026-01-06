# ===============================
# Base image
# ===============================
FROM python:3.10-slim

# ===============================
# Install system dependencies
# ===============================
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# ===============================
# Set working directory
# ===============================
WORKDIR /app

# ===============================
# Copy project
# ===============================
COPY . .

# ===============================
# Install Python dependencies
# ===============================
RUN pip install --no-cache-dir -r python/requirements.txt

# ===============================
# Install Node dependencies
# ===============================
WORKDIR /app/node
RUN npm install

# ===============================
# Back to root
# ===============================
WORKDIR /app

# ===============================
# Expose port (Render-safe)
# ===============================
EXPOSE 5050

# ===============================
# Start server
# ===============================
CMD ["node", "node/server.js"]