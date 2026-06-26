import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type User = {
  id: string
  username: string
  name: string | null
  email: string | null
}

const authApi = {
  login: (body: { username: string; password: string }) =>
    apiFetch<User>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me"),
  updateProfile: (body: { name?: string; email?: string }) =>
    apiFetch("/auth/update-profile", { method: "POST", body: JSON.stringify(body) }),
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

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

