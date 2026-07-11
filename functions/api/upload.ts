/**
 * Cloudflare Pages Serverless Function Template
 * Route: /api/upload
 * 
 * When you deploy this project to Cloudflare Pages, Cloudflare compiles files inside the 
 * "/functions" folder into serverless edge API endpoints.
 * 
 * This endpoint demonstrates how to handle secure video/thumbnail uploads directly to Cloudflare R2
 * using direct native bucket bindings (no external AWS SDK required, maximum speed, zero cost!).
 */

interface Env {
  // Bind your Cloudflare R2 bucket in the Pages Dashboard called "CINEMAX_MEDIA"
  CINEMAX_MEDIA: {
    put(key: string, value: any, options?: any): Promise<any>;
    get(key: string): Promise<any>;
    delete(key: string): Promise<void>;
  };
  
  // Bind your Cloudflare KV Namespace to persist video metadata lists
  CINEMAX_METADATA_KV: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
  };

  // Secure Secret Key to sign/authenticate requests (Set in Cloudflare Dashboard -> Settings -> Environment Variables)
  CLOUDFLARE_API_SECRET_KEY?: string;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // Set up robust CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Basic security passcode check (if enabled in environment variables)
  const apiKey = request.headers.get('X-API-Key');
  if (env.CLOUDFLARE_API_SECRET_KEY && apiKey !== env.CLOUDFLARE_API_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized Access. Invalid API Secret Key.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);

    // --- CASE 1: GET REQUEST (Fetch upload URL or stream catalog list) ---
    if (request.method === 'GET') {
      const filename = url.searchParams.get('file');
      if (!filename) {
        const action = url.searchParams.get('action');
        if (action === 'comments') {
          const comments = await env.CINEMAX_METADATA_KV.get('video_comments_v1') || '[]';
          return new Response(comments, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (action === 'profiles') {
          const profiles = await env.CINEMAX_METADATA_KV.get('video_profiles_v1') || '[]';
          return new Response(profiles, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Return existing metadata index
        const catalog = await env.CINEMAX_METADATA_KV.get('video_catalog_v1') || '[]';
        return new Response(catalog, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return a simulated ingestion URL or handle generating presigned keys
      return new Response(JSON.stringify({
        message: 'Ready to receive payload.',
        uploadUrl: `${url.origin}/api/upload?file=${encodeURIComponent(filename)}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- CASE 2: PUT/POST REQUEST (Update catalog in KV OR upload file directly to Cloudflare R2) ---
    if (request.method === 'PUT' || request.method === 'POST') {
      const action = url.searchParams.get('action');
      const isCatalogUpdate = action === 'catalog' || url.searchParams.get('catalog') === 'true';
      const isCommentsUpdate = action === 'comments';
      const isProfilesUpdate = action === 'profiles';

      if (isCatalogUpdate || isCommentsUpdate || isProfilesUpdate) {
        // Parse the body as JSON and write it directly to KV!
        const jsonBody = await request.text();
        if (!env.CINEMAX_METADATA_KV) {
          return new Response(JSON.stringify({ 
            error: 'Cloudflare KV Namespace binding "CINEMAX_METADATA_KV" not configured in your Cloudflare dashboard.' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const kvKey = isCatalogUpdate 
          ? 'video_catalog_v1' 
          : isCommentsUpdate 
            ? 'video_comments_v1' 
            : 'video_profiles_v1';

        await env.CINEMAX_METADATA_KV.put(kvKey, jsonBody);
        return new Response(JSON.stringify({
          success: true,
          message: `Successfully updated the ${kvKey} in KV`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const filename = url.searchParams.get('file') || `media-${Date.now()}`;
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

      // Check if Cloudflare R2 bucket binding is active
      if (!env.CINEMAX_MEDIA) {
        return new Response(JSON.stringify({ 
          error: 'Cloudflare R2 Bucket binding "CINEMAX_MEDIA" not configured in your Cloudflare Dashboard.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Stream the body chunks directly to Cloudflare R2 Storage (Streaming write - memory safe, huge files allowed!)
      const fileBody = request.body;
      if (!fileBody) {
        return new Response(JSON.stringify({ error: 'Empty payload body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Write binary chunk stream to Cloudflare R2 bucket
      await env.CINEMAX_MEDIA.put(filename, fileBody, {
        httpMetadata: { contentType: contentType }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully written to Cloudflare R2 bucket',
        mediaKey: filename,
        // Replace with your custom domain or R2 public access subdomain
        url: `/cdn/${filename}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not supported' }), {
      status: 405,
      headers: corsHeaders,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Serverless execution error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
