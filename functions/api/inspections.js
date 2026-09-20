// Cloudflare Pages Function: /api/inspections
// Handles GET, POST, DELETE for inspection records using Cloudflare KV

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const kv = env.INSPECTIONS_KV;

  try {
    // GET /api/inspections  → return all records
    if (method === 'GET' || method === 'HEAD') {
      const index = await kv.get('index', { type: 'json' });
      const ids = Array.isArray(index) ? index : [];

      // Fetch all records in parallel
      const records = await Promise.all(
        ids.map(id => kv.get(`record:${id}`, { type: 'json' }))
      );

      const validRecords = records.filter(r => r !== null);

      const body = JSON.stringify(validRecords);
      return new Response(method === 'HEAD' ? null : body, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // POST /api/inspections  → save or update a record
    if (method === 'POST') {
      const inspectionData = await request.json();
      if (!inspectionData || !inspectionData.id) {
        return new Response(JSON.stringify({ error: 'Missing id field' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const id = inspectionData.id;

      // Update index
      let index = await kv.get('index', { type: 'json' });
      if (!Array.isArray(index)) index = [];
      if (!index.includes(id)) {
        index.unshift(id); // Add to front
        await kv.put('index', JSON.stringify(index));
      }

      // Store full record
      await kv.put(`record:${id}`, JSON.stringify(inspectionData));

      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/inspections?id=xxx  → delete a record
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id param' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Remove from index
      let index = await kv.get('index', { type: 'json' });
      if (Array.isArray(index)) {
        index = index.filter(i => i !== id);
        await kv.put('index', JSON.stringify(index));
      }

      // Delete record
      await kv.delete(`record:${id}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
