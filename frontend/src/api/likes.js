import api from "../api";

export const likePostRequest = async (postId) => {
  const { data } = await api.post(
    `/api/posts/${postId}/like`,
  );

  return data;
};

export const unlikePostRequest = async (postId) => {
  const { data } = await api.delete(
    `/api/posts/${postId}/like`,
  );

  return data;
};