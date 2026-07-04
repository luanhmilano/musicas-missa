import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

api.interceptors.request.use((config) => {
  console.debug('[frontend][api] request', {
    method: config.method,
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    params: config.params,
    data: config.data,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.debug('[frontend][api] response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response;
  },
  (error) => {
    console.error('[frontend][api] error', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);