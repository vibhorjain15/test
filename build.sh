#!/bin/bash
set -ex  # Enable debugging and exit on error

# Function to handle errors and cleanup
cleanup() {
    echo "Build failed! Performing cleanup..."
    # Add any cleanup commands here (e.g., removing temporary files, stopping services)
    echo "Build failed! Performing cleanup..."
    pkill -f "grunt" || true
    pkill -f "npm" || true
    rm -rf ./dist ./static ./.tmp ./node_modules/.cache || true
    git reset --hard HEAD
    git clean -fd
    npm cache clean --force || true
    bower cache clean || true
    echo "Cleanup completed."
    exit 1
}

# Trap errors and call cleanup function
trap cleanup ERR

# Install dependencies (parallelized)
echo "Installing npm and bower dependencies..."
npm install --legacy-peer-deps & 
bower install & 
wait
echo "Dependencies installed successfully."

# Set COMMIT_SHA if not already set
if [ -z ${COMMIT_SHA+x} ]; then
    COMMIT_SHA=$(git rev-parse --short HEAD)
    echo "COMMIT_SHA set to: $COMMIT_SHA"
fi

# Write version to file
echo "Writing version to sentry-release-version.constant.ts..."
echo "export const version = '$COMMIT_SHA';" > "./src/app2/shared/constants/sentry-release-version.constant.ts"
echo "Version file updated."

# Build the project
echo "Starting build process..."
if grunt build:app && npm run-script mono-build-many; then
    echo "Build completed successfully."

    # Handle Sentry CLI commands if SENTRY_AUTH_TOKEN is set
    # if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    #     echo "Configuring Sentry..."
    #     npm install -g @sentry/cli@2.17.2
    #     sentry-cli login --auth-token "$SENTRY_AUTH_TOKEN"
    #     sentry-cli releases new "$COMMIT_SHA"
    #     sentry-cli releases set-commits "$COMMIT_SHA" --local --ignore-missing --ignore-empty
    #     sentry-cli sourcemaps inject ./dist
    #     sentry-cli sourcemaps upload --use-artifact-bundle --release="$COMMIT_SHA" ./dist --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"
    #     sentry-cli releases finalize "$COMMIT_SHA"
    #     echo "Sentry configuration completed."
    # fi

    # Commit and push changes
    echo "Committing and pushing changes..."
    git add ./src/app2/shared/constants/sentry-release-version.constant.ts
    git add dist/ static/ -A -- ':!*.map'
    git commit -m "app build"
    git push -u origin main
    echo "Changes pushed successfully."
else
    echo "Build failed!"
    exit 1
fi
