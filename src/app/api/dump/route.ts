export async function GET() { return new Response(JSON.stringify((globalThis as any).db_temples || []), { headers: { 'Content-Type': 'application/json' } }); }
