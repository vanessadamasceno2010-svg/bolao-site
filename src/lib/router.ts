import { useEffect, useState } from 'react';

// Hash-based routing for single-file build compatibility
// Routes:
//   #/                  -> Landing
//   #/dashboard         -> Organizer dashboard
//   #/create            -> Create bolão
//   #/manage/:id        -> Manage bolão (organizer)
//   #/admin/results     -> Update match results (simulated)
//   #/b/:slug           -> Public bolão page
//   #/b/:slug/join      -> Join (checkout)
//   #/b/:slug/predict/:cotaId -> Make predictions
//   #/b/:slug/ranking   -> Public ranking

export function getRoute(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

export function parseRoute(route: string): { path: string; params: Record<string, string> } {
  // remove query string (?ref=, ?email=, etc.) antes de interpretar a rota
  const cleanRoute = route.split('?')[0];
  const parts = cleanRoute.split('/').filter(Boolean);
  if (parts.length === 0) return { path: 'home', params: {} };

  // ── Portal do Organizador (protegido por login) ──
  if (parts[0] === 'organizador') {
    if (parts.length === 1)                             return { path: 'org-login', params: {} };
    if (parts[1] === 'forgot')                          return { path: 'org-login', params: {} }; // usa a mesma tela
    if (parts[1] === 'dashboard')                       return { path: 'org-dashboard', params: {} };
    if (parts[1] === 'create')                          return { path: 'org-create', params: {} };
    if (parts[1] === 'manage' && parts[2])              return { path: 'org-manage', params: { id: parts[2] } };
    if (parts[1] === 'results')                         return { path: 'org-results', params: {} };
    return { path: 'org-login', params: {} };
  }

  // ── Rotas legadas (redirecionam ao portal) ──
  if (parts[0] === 'dashboard') return { path: 'org-login', params: {} };
  if (parts[0] === 'create')    return { path: 'org-login', params: {} };
  if (parts[0] === 'admin' && parts[1] === 'results') return { path: 'org-login', params: {} };
  if (parts[0] === 'manage' && parts[1]) return { path: 'org-login', params: {} };

  // ── Rotas públicas do participante ──
  if (parts[0] === 'modelo-a') return { path: 'modelo-a', params: {} };
  if (parts[0] === 'my') return { path: 'my', params: {} };
  if (parts[0] === 'perfil') return { path: 'perfil', params: {} };
  if (parts[0] === 'terms') return { path: 'terms', params: {} };
  if (parts[0] === 'privacy') return { path: 'privacy', params: {} };
  if (parts[0] === 'legal') return { path: 'legal', params: {} };

  if (parts[0] === 'b' && parts[1]) {
    const slug = parts[1];
    if (parts[2] === 'join') return { path: 'join', params: { slug } };
    if (parts[2] === 'predict' && parts[3]) return { path: 'predict', params: { slug, cotaId: parts[3] } };
    if (parts[2] === 'ranking') return { path: 'ranking', params: { slug } };
    if (parts[2] === 'indicacao' && parts[3]) return { path: 'my-referrals', params: { slug, cotaId: parts[3] } };
    if (parts[2] === 'success' && parts[3]) return { path: 'success', params: { slug, cotaId: parts[3] } };
    return { path: 'bolao', params: { slug } };
  }
  return { path: 'home', params: {} };
}
