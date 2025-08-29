#!/bin/bash
cd /home/kavia/workspace/code-generation/elegant-tailor-studio-website-152337-152365/tailor_studio_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

