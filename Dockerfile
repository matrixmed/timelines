FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only one npm install needed)
RUN npm install

# Copy all project files
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built frontend assets
COPY --from=build /app/build ./build

# Copy server directory
COPY --from=build /app/server ./server

# Copy node_modules (they're at the root level)
COPY --from=build /app/node_modules ./node_modules

# Expose the port
EXPOSE 3001

# Start the server
WORKDIR /app
CMD ["node", "server/index.js"]