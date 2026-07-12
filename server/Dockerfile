# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Copy only the production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built code from the builder stage
COPY --from=builder /app/dist ./dist

# Start the application
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]
