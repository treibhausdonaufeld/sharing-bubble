# Build stage
FROM oven/bun:1-alpine AS build

WORKDIR /app

# Copy package files
COPY bun.lockb package*.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]