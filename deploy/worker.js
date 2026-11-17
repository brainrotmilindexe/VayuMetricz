// VayuMetricz — static SPA worker.
// All routes are client-side (React Router); serve prebuilt assets and let the
// platform's SPA fallback return index.html for unknown paths.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
