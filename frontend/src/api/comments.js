import api from "../api";

export const fetchComments = async (
  postId,
  {
    page = 1,
    limit = 20,
  } = {},
) => {
  const { data } = await api.get(
    `/api/posts/${postId}/comments`,
    {
      params: {
        page,
        limit,
      },
    },
  );

  return data;
};

export const createCommentRequest = async (
  postId,
  content,
  parentCommentId = null,
) => {
  const { data } = await api.post(
    `/api/posts/${postId}/comments`,
    {
      content,
      parentCommentId,
    },
  );

  return data;
};

export const updateCommentRequest = async (
  commentId,
  content,
) => {
  const { data } = await api.put(
    `/api/comments/${commentId}`,
    {
      content,
    },
  );

  return data;
};

export const deleteCommentRequest = async (commentId) => {
  const { data } = await api.delete(
    `/api/comments/${commentId}`,
  );

  return data;
};