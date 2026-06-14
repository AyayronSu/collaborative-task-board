import axios from 'axios'

const client = axios.create({
    withCredentials: true,
})

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            return Promise.reject({
                status: 0,
                message: 'Network error. Check your connection.',
            })
        }

        const { status, data } = error.response

        const messages = {
            400: data?.error || 'Invalid request.',
            401: 'You need to be logged in to do that.',
            403: 'You don\'t have permission to do that.',
            404: data?.error || 'Not found.',
            409: data?.error || 'Conflict - this already exists.',
            422: data?.error || 'Invalid data.',
            500: 'Server error. Try again in a moment.',
        }

        return Promise.reject({
            status,
            message: messages[status] || data?.error || 'An unexpected error occurred.',
        })
    }
)

export default client