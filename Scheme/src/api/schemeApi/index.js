import api from "../request";
export const addScheme = (params) => api.post(`/addScheme`, params)
export const delScheme = (params) => api.post(`/delScheme`, params)
export const getScheme = (params) => api.get(`/getScheme`, { params })