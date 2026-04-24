import { request } from "../lib/api";

interface UserResponse {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  email?: string;
  coverImage?: string;
  subscribers?: number;
  subscriberCount?: number;
}

interface UpdateAccountDetailsPayload {
  fullName?: string;
  email?: string;
  username?: string;
}

export const updateAccountDetails = async (data: UpdateAccountDetailsPayload) =>
  request<UserResponse>("/users/update-detail", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changeCurrentPassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) =>
  request<void>("/users/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateUserAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return request<UserResponse>("/users/avatar", {
    method: "PATCH",
    body: formData,
    isFormData: true,
  });
};

export const updateUserCoverImage = async (file: File) => {
  const formData = new FormData();
  formData.append("coverImage", file);

  return request<UserResponse>("/users/update-cover", {
    method: "PATCH",
    body: formData,
    isFormData: true,
  });
};
