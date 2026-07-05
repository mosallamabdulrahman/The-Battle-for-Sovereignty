# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package management files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package files, public folder, and the build outputs
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Install only production dependencies for smaller image size
RUN npm ci --omit=dev

EXPOSE 3000

# Start the application using next start
CMD ["npm", "start"]
