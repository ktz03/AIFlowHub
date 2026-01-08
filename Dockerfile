# Build local monorepo image
FROM node:20-alpine

# Install system dependencies
RUN apk add --update --no-cache \
    libc6-compat python3 py3-pip py3-setuptools make g++ \
    build-base cairo-dev pango-dev \
    chromium git

# Configure npm/pnpm to use China mirror (for faster downloads in China)
RUN npm config set registry https://registry.npmmirror.com

# Install PNPM globally
RUN npm install -g pnpm

# Configure pnpm with China mirror and increased timeout
RUN pnpm config set store-dir /root/.local/share/pnpm/store && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_OPTIONS=--max-old-space-size=8192

WORKDIR /usr/src

# Copy all files first
COPY . .

# Install dependencies with shamefully-hoist to fix module resolution
RUN pnpm install --shamefully-hoist

# Build
RUN pnpm build

EXPOSE 3000

CMD [ "pnpm", "start" ]
