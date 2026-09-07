import { apiRequest } from "./api";

export function fetchNotifications() {
  return apiRequest("/api/notifications");
}

export function markNotificationRead(id) {
  return apiRequest("/api/notifications", {
    method: "PUT",
    body: { id },
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/api/notifications", {
    method: "PUT",
    body: { all: true },
  });
}
