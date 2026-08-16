# Build local monorepo image - Optimized for faster builds
FROM node:20-alpine

# Install system dependencies
RUN apk add --update --no-cache \
    libc6-compat python3 python3-dev py3-pip make g++ \
    build-base cairo-dev pango-dev \
    chromium git cmake

# Install Python setuptools (required for node-gyp/sqlite3)
RUN pip3 install setuptools --break-system-packages

# Install PNPM globally
RUN npm install -g pnpm

# Configure pnpm - use npmmirror
RUN pnpm config set store-dir /root/.local/share/pnpm/store && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_OPTIONS=--max-old-space-size=4096

# Skip native module builds that require GitHub access
ENV npm_config_build_from_source=false
ENV FAISS_NODE_SKIP_BUILD=true

WORKDIR /usr/src

# Copy all source files
COPY . .

# Install dependencies - ignore optional dependencies that fail
RUN pnpm install --shamefully-hoist --ignore-scripts || true

# Run postinstall scripts separately (skip failing ones)
RUN pnpm rebuild sqlite3 || true

# Build
RUN pnpm build

EXPOSE 3000

CMD [ "pnpm", "start" ]
