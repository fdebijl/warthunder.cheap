// This file is excluded from the docker image so you can safely set the API url to be localhost here, without affecting your prod environment.
// At runtime (in the Docker entrypoint script), the env vars are injected into this file so the frontend can access them. See entrypoint.sh for more details.

export const API_URL = 'http://localhost:3000/api/v1';
// Or alternatively, if you're not working on the API
// export const API_URL = 'https://warthunder.cheap/api/v1';
