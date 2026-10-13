import api from "../api";

export const fetchPosts = async ({
  page = 1,
  limit = 10,
  sectorId,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (sectorId) {
    params.sectorId = sectorId;
  }

  const { data } = await api.get(
    "/api/posts",
    {
      params,
    },
  );

  return data;
};

export const fetchPostById = async (
  postId,
) => {
  const { data } = await api.get(
    `/api/posts/${postId}`,
  );

  return data;
};

export const createPostRequest = async ({
  content,
  files = [],
}) => {
  const formData = new FormData();

  formData.append(
    "content",
    JSON.stringify(
      content.map((text) => ({
        type: "paragraph",
        text,
      })),
    ),
  );

  files.forEach((file) => {
    formData.append(
      "files",
      file,
    );
  });

  const { data } = await api.post(
    "/api/posts",
    formData,
  );

  return data;
};

export const updatePostRequest = async ({
  postId,
  content,
}) => {
  const { data } = await api.put(
    `/api/posts/${postId}`,
    {
      content: content.map(
        (text) => ({
          type: "paragraph",
          text,
        }),
      ),
    },
  );

  return data;
};

export const deletePostRequest = async (
  postId,
) => {
  const { data } = await api.delete(
    `/api/posts/${postId}`,
  );

  return data;
};