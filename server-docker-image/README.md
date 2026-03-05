# server-docker-image

- With runpod, you can use Docker image `ghcr.io/minutesgenerator/server-docker-image:4` (or latest version instead of 4)
- Need to update the server push script to point to the new prod hostname
- Run platform/server/push to push relevant files up to the server
- SSH into the server and run `platform/server/setup.sh` to finish install (only need to run this the first time)
