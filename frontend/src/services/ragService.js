import axios from 'axios';

// Update this to your computer's local IP when testing on a physical device
// For emulator use 10.0.2.2 (Android emulator loopback to host)
const BASE_URL = 'http://10.0.2.2:8000';

export async function queryFood(question) {
  const response = await axios.post(
    `${BASE_URL}/query/food`,
    { question },
    { timeout: 30000 }
  );
  const { answer, image_urls = [], source_pages = [], source_docs = [] } = response.data;
  return { answer, imageUrls: image_urls.map(u => `${BASE_URL}${u}`), sourcePages: source_pages, sourceDocs: source_docs };
}

export async function queryDMV(question) {
  const response = await axios.post(
    `${BASE_URL}/query/dmv`,
    { question },
    { timeout: 30000 }
  );
  const { answer, image_urls = [], source_pages = [], source_docs = [] } = response.data;
  return { answer, imageUrls: image_urls.map(u => `${BASE_URL}${u}`), sourcePages: source_pages, sourceDocs: source_docs };
}

export async function checkHealth() {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
  return response.data;
}
