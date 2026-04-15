import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host')?.split(':')[0] || 'localhost'

  // Exclude _next and api routes from getting rewritten
  if (url.pathname.startsWith('/_next') || url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  const depedBasePath = '/tenant/roles-pages/Deped'

  const depedRoutes: Record<string, string> = {
    '/load-manager': 'load-manager',
    '/principal': 'principal',
    '/teacher': 'teacher',
    '/subject-room-management': 'subject-room-management',
  }

  const target = depedRoutes[url.pathname]

  if (target) {
    return NextResponse.rewrite(
      new URL(`${depedBasePath}/${target}`, req.url)
    )
  }

  const collegeBasePath = '/tenant/roles-pages/College'

  const collegeRoutes: Record<string, string> = {
    '/dean': 'dean',
    '/loadmanager': 'loadmanager',
    '/teacher': 'teacher',
    '/subject-room-management': 'subject-room-management',
    '/vpaa': 'vpaa',
  }

  const targetCollege = collegeRoutes[url.pathname] // ✅ FIXED

  if (targetCollege) {
    return NextResponse.rewrite(
      new URL(`${collegeBasePath}/${targetCollege}`, req.url)
    )
  }

  const subdomain = hostname.split('.')[0]

  // Option 2: Allow direct access to superadmin and tenant for local testing without subdomains
  if (subdomain === 'localhost' && (url.pathname.startsWith('/superadmin') || url.pathname.startsWith('/tenant'))) {
    return NextResponse.next()
  }

  if (subdomain === 'localhost') {
    // In local dev, serve the landing page at root and keep other routes unchanged.
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/LandingPage', req.url))
    }

    return NextResponse.next()
  }

  if (subdomain === 'admin') {
    const newPath = url.pathname === '/' ? '/superadmin' : `/superadmin${url.pathname}`
    return NextResponse.rewrite(new URL(newPath, req.url))
  }

  if (subdomain !== 'www' && subdomain !== 'yourapp' && subdomain !== 'localhost') {
    const newPath = url.pathname === '/' ? '/tenant' : `/tenant${url.pathname}`
    return NextResponse.rewrite(new URL(newPath, req.url))
  }

  const newPath = url.pathname === '/' ? '/LandingPage' : `/LandingPage${url.pathname}`
  return NextResponse.rewrite(new URL(newPath, req.url))
}