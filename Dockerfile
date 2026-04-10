FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (need devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/index.cjs"]
