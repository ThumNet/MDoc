export default function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response
    }

    var error = new Error(response.statusText || response.status)
    error.response = response;
    throw error;
}