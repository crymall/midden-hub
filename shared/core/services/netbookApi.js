import axios from "axios";

const netbookApi = axios.create({
  baseURL: "/netbook",
  withCredentials: true,
});

export const fetchNotes = async (page = 1, pageSize = 10) => {
  const response = await netbookApi.get("/notes", { params: { page, pageSize } });
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await netbookApi.post("/notes", noteData);
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await netbookApi.put(`/notes/${id}`, { ...noteData, id });
  return response.data;
};

export const deleteNote = async (id, updatedAt) => {
  // Optional precondition: when present, the server 409s if its stored row is newer.
  const response = updatedAt
    ? await netbookApi.delete(`/notes/${id}`, { data: { updatedAt } })
    : await netbookApi.delete(`/notes/${id}`);
  return response.data;
};
