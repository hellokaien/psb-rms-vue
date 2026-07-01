const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getCookie(name) {
  if (typeof document === 'undefined') {
    return ''
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))

  if (!match) {
    return ''
  }

  return decodeURIComponent(match.slice(name.length + 1))
}

async function refreshCsrfCookie() {
  await fetch(`${apiBaseUrl}/auth/csrf-cookie`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })
}

function withXsrfHeader(headers) {
  const xsrfToken = getCookie('XSRF-TOKEN')

  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken
  }

  return headers
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (needsCsrf) {
    await refreshCsrfCookie()
    withXsrfHeader(headers)
  }

  const requestOptions = {
    credentials: 'include',
    ...options,
    method,
    headers,
  }

  const response = await fetch(`${apiBaseUrl}${path}`, requestOptions)

  if (needsCsrf && response.status === 419) {
    await refreshCsrfCookie()
    withXsrfHeader(headers)

    return fetch(`${apiBaseUrl}${path}`, requestOptions)
  }

  return response
}

export { apiBaseUrl }
