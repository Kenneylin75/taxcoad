export async function GET() { return new Response(JSON.stringify({message: 'deprecated'}), { headers: { 'Content-Type': 'application/json' } }); }
