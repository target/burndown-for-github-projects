# This multi-stage build will create a lean output image which only contains the
# built production code and dependencies, as opposed to including all source files,
# build files, production dependencies, and development dependencies in one big image.

FROM node:22.0.0-alpine@sha256:68d426074f205de1678bcbb6e43f5f4699b2e6e6e3ac50e0aa1a91daabd35602 as build
WORKDIR /app
# Import source files and manifests
COPY . .
# Install dependencies
RUN npm ci
# Build TS -> JS
RUN npm run build

FROM node:22.0.0-alpine@sha256:68d426074f205de1678bcbb6e43f5f4699b2e6e6e3ac50e0aa1a91daabd35602
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 burndown

# Import built files and manifests
COPY --chown=burndown:nodejs --from=build /app/build build
COPY --chown=burndown:nodejs --from=build /app/package.json package.json
COPY --chown=burndown:nodejs --from=build /app/package-lock.json package-lock.json
# Install only production dependencies
RUN npm ci --prod

USER burndown

# Serve the application on container startup
CMD npm run serve
