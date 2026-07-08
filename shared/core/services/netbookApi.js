import axios from "axios";

const netbookApi = axios.create({
  baseURL: "/netbook",
  withCredentials: true,
});

export const fetchNotes = async () => {
  const response = await netbookApi.get("/notes");
  return response.data;
};

export const fetchNote = async (id) => {
  const response = await netbookApi.get(`/notes/${id}`);
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

export const deleteNote = async (id) => {
  const response = await netbookApi.delete(`/notes/${id}`);
  return response.data;
};
