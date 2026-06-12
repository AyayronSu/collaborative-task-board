// frontend/src/api/tasks.js
import client from './client'

const base = (workspaceId) => `/api/workspaces/${workspaceId}/tasks`

export const getTasks     = (wsId)        => client.get(`${base(wsId)}/`)
export const createTask   = (wsId, data)  => client.post(`${base(wsId)}/`, data)
export const updateTask   = (wsId, id, data) => client.patch(`${base(wsId)}/${id}`, data)
export const deleteTask   = (wsId, id)    => client.delete(`${base(wsId)}/${id}`)