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

async function ensureCsrfCookie() {
  if (getCookie('XSRF-TOKEN')) {
    return
  }

  await fetch(`${apiBaseUrl}/auth/user`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await ensureCsrfCookie()

    const xsrfToken = getCookie('XSRF-TOKEN')
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }
  }

  return fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...options,
    method,
    headers,
  })
}

export { apiBaseUrl }
