// frontend/src/api/workspaces.js
import client from './client'

export const getWorkspaces    = ()              => client.get('/api/workspaces/')
export const createWorkspace  = (data)          => client.post('/api/workspaces/', data)
export const deleteWorkspace  = (id)            => client.delete(`/api/workspaces/${id}`)
export const renameWorkspace  = (id, data)      => client.patch(`/api/workspaces/${id}`, data)