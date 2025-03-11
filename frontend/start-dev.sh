#!/bin/bash

# This script passes system environment variables to Vite
source ~/.zshrc

# Pass the environment variables to the Vite dev server
VITE_SUPABASE_URL=$SUPABASE_URL \
VITE_SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
VITE_SUPABASE_API_KEY=$SUPABASE_API_KEY \
VITE_BASE_API_URL=$BASE_API_URL \
npm run dev