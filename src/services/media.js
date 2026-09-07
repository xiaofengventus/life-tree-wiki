import { apiRequest } from "./api";

export function fetchMediaLibrary(page = 1) {
  return apiRequest(`/api/media?page=${encodeURIComponent(page)}`);
}

export function deleteMediaImage(hash) {
  return apiRequest(`/api/media/${encodeURIComponent(hash)}`, { method: "DELETE" });
}

export function fetchHomeGallery() {
  return apiRequest("/api/home-gallery");
}

export function updateHomeGallery(hashes) {
  return apiRequest("/api/home-gallery", {
    method: "PUT",
    body: { hashes },
  });
}
