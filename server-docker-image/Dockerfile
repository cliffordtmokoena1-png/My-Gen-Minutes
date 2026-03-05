FROM ghcr.io/minutesgenerator/server-docker-image-base:latest

# Install required packages
RUN apt-get update && \
  apt-get install -y wget screen rsync vim openssh-server && \
  rm -rf /var/lib/apt/lists/*

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
  bash /tmp/miniconda.sh -b -p /opt/miniconda && \
  rm /tmp/miniconda.sh

ENV PATH=/opt/miniconda/bin:$PATH

# Initialize conda
RUN /opt/miniconda/bin/conda init bash

# Download and extract the pyannote speaker diarization data
RUN wget -O - https://minutesgeneratorpublic.s3.amazonaws.com/data-2023-03-25-02.tar.gz | tar xz -C /

CMD bash -c 'apt update; mkdir -p ~/.ssh; cd ~/.ssh; chmod 700 ~/.ssh; echo "$PUBLIC_KEY" >> authorized_keys; chmod 600 authorized_keys; service ssh start; sleep infinity'
