#!/bin/bash
# 5D+ Dashboard Launcher
# This script starts the local server and opens the dashboard in your default browser.

# Navigate to the project directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/5d-plus-dashboard"

# Check if node_modules exists, install if not (first run only)
if [ ! -d "node_modules" ]; then
    echo "First run detected. Installing dependencies..."
    npm install
fi

# Start the server with Netlify Dev
echo "Starting 5D+ Dashboard with Netlify Dev..."
# Use npx to run the locally installed netlify-cli
npx netlify dev &
SERVER_PID=$!

# Wait for server to start (approx 5 seconds for Netlify initialization)
sleep 5

# Open the dashboard in the default browser (Netlify Dev default port is 8888)
open http://localhost:8888

# Keep the terminal open to keep the server running
echo "---------------------------------------------------"
echo "5D+ Dashboard is running!"
echo "Close this window to stop the dashboard."
echo "---------------------------------------------------"
wait $SERVER_PID
