#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel)
ENV_NAME=mgenv


# Check if conda environment already exists
if conda env list | grep -q "^$ENV_NAME\s"; then
  echo "Conda environment '$ENV_NAME' already exists."
  exit 0
fi

echo "Creating conda environment '$ENV_NAME'..."

# Creates conda environment "mgenv" used on the server, and for IDE support
conda create -n $ENV_NAME python=3.11 -y
conda run -n $ENV_NAME pip install python-dotenv pyinstrument openai-whisper soundfile torchaudio speechbrain silero-vad
conda clean -afy
