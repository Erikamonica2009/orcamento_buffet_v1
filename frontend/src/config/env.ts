// Em produção (Vercel) a API fica no mesmo domínio, em /api, repassada ao backend por vercel.json:
// assim o cookie de sessão é de primeira parte. Localmente o docker-compose define a URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000");
