# Stage 1: Build TypeScript
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json *.ts ./
RUN npx tsc --project tsconfig.json

# Stage 2: Manim + Node.js runtime
FROM manimcommunity/manim:stable

USER root

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install LaTeX packages required by Manim
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    texlive-fonts-recommended \
    dvisvgm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json* ./
RUN npm ci --production

# Create video output directory
RUN mkdir -p /app/public/videos /tmp/manim_render && \
    chown -R manimuser:manimuser /app /tmp/manim_render

USER manimuser

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production
ENV VIDEO_OUTPUT_DIR=/app/public/videos

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
