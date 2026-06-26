import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type User = { id: string; username: string }

const authApi = {
  login: (body: { username: string; password: string }) =>
    apiFetch<User>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
}

export function useLogin() {
  return useMutation({ mutationFn: authApi.login })
}

export function useLogout() {
  return useMutation({ mutationFn: authApi.logout })
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword })
}
