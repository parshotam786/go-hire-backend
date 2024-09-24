FROM node:16-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:16-alpine AS final

# --- START: Install Chromium ---
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && apk add --no-cache --virtual .build-deps g++ make python3

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser
# --- END: Install Chromium ---

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example .
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --production
EXPOSE 8080

# Run the project using 'npm run server'
CMD ["npm", "run", "server"]
