const API_BASE = '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Jobs
  getJobStatus: (queue, id) => request(`/jobs/${queue}/${id}`),
  getAllJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs?${qs}`);
  },

  // Images
  enqueueImages: (imageUrls) => request('/images', { method: 'POST', body: { image_urls: imageUrls } }),
  searchImages: (query) => request(`/download/images?search=${encodeURIComponent(query)}`),
  getImages: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/images?${qs}`);
  },

  // Posts
  enqueuePosts: (postUrls) => request('/posts', { method: 'POST', body: { post_urls: postUrls } }),
  evaluatePost: (postId, resultsNumber = 10) => request(`/posts/${postId}/images?results_number=${resultsNumber}`),
  getPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts?${qs}`);
  },

  // Cost Log
  getCostLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cost-log?${qs}`);
  },

  // Health
  health: () => request('/health')
};

export async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}