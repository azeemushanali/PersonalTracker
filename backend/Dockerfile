FROM node:18-alpine

WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend application files
COPY backend/ .

# Copy index.html from root directory
COPY index.html ./index.html

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
