import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route Redirect Handler
 * Redirects old API paths to new v1 versioned paths for backwards compatibility
 */

const API_REDIRECTS: Record<string, string> = {
  // Auth redirects
  '/api/auth/': '/api/v1/auth/',
  
  // Admin redirects
  '/api/admin/': '/api/v1/admin/',
  
  // Groups redirects
  '/api/groups/': '/api/v1/groups/',
  
  // Invitations redirects
  '/api/invitations/': '/api/v1/invitations/',
  '/api/send-invitation': '/api/v1/invitations/send-invitation',
  
  // Users/Collection redirects
  '/api/collection/': '/api/v1/users/collection/',
  '/api/create-profile': '/api/v1/users/create-profile',
  
  // Recipes redirects
  '/api/notify-new-recipe': '/api/v1/recipes/notify-new-recipe',
};

export async function GET(request: NextRequest) {
  return handleRedirect(request);
}

export async function POST(request: NextRequest) {
  return handleRedirect(request);
}

export async function PUT(request: NextRequest) {
  return handleRedirect(request);
}

export async function DELETE(request: NextRequest) {
  return handleRedirect(request);
}

function handleRedirect(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Find matching redirect
  for (const [oldPath, newPath] of Object.entries(API_REDIRECTS)) {
    if (pathname.startsWith(oldPath)) {
      const redirectUrl = pathname.replace(oldPath, newPath) + url.search;
      console.warn(`⚠️  Deprecated API path used: ${pathname} → redirecting to: ${redirectUrl}`);
      
      return NextResponse.redirect(new URL(redirectUrl, url.origin), 301);
    }
  }

  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'Please use versioned API endpoints (e.g., /api/v1/...)',
      deprecated: pathname,
      docs: 'https://docs.yoursite.com/api-migration'
    }, 
    { status: 404 }
  );
}