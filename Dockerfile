# This multi-stage build will create a lean output image which only contains the
# built production code and dependencies, as opposed to including all source files,
# build files, production dependencies, and development dependencies in one big image.

FROM node:22.9.0-alpine@sha256:c9bb43423a6229aeddf3d16ae6aaa0ff71a0b2951ce18ec8fedb6f5d766cf286 as build
WORKDIR /app
# Import source files and manifests
COPY . .
# Install dependencies
RUN npm ci
# Build TS -> JS
RUN npm run build

FROM node:22.9.0-alpine@sha256:c9bb43423a6229aeddf3d16ae6aaa0ff71a0b2951ce18ec8fedb6f5d766cf286
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
