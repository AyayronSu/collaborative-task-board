import client from './client'

const base = (workspaceId) => `/api/workspaces/${workspaceId}/members`

export const getMembers   = (wsId)              => client.get(`${base(wsId)}/`)
export const addMember    = (wsId, data)         => client.post(`${base(wsId)}/`, data)
export const removeMember = (wsId, targetUserId) => client.delete(`${base(wsId)}/${targetUserId}`)