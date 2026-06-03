import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { OrgLayout } from './components/OrgLayout';
import { parseRoute, useRoute } from './lib/router';
import { getOrgSession } from './lib/storage';

// Páginas do participante
import { Home } from './pages/Home';
import { PublicBolao } from './pages/PublicBolao';
import { JoinBolao } from './pages/JoinBolao';
import { Predictions } from './pages/Predictions';
import { Ranking } from './pages/Ranking';
import { MyArea } from './pages/MyArea';
import { MyReferrals } from './pages/MyReferrals';
import { Perfil } from './pages/Perfil';
import { ModeloA } from './pages/ModeloA';
import { Terms, Privacy, LegalNotice } from './pages/Legal';

// Páginas do organizador
import { OrgLogin } from './pages/OrgLogin';
import { Dashboard } from './pages/Dashboard';
import { CreateBolao } from './pages/CreateBolao';
import { ManageBolao } from './pages/ManageBolao';
import { AdminResults } from './pages/AdminResults';

import { seedDemoIfEmpty } from './lib/storage';

export default function App() {
  const route = useRoute();
  const { path, params } = parseRoute(route);

  useEffect(() => {
    seedDemoIfEmpty();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const orgSession = getOrgSession();
  const isOrgRoute = path.startsWith('org-');

  // ── PORTAL DO ORGANIZADOR ──
  // Rotas de organizador SEMPRE passam pelo OrgLayout.
  // Se não logado, mostra tela de login (exceto na própria tela de login).
  if (isOrgRoute) {
    return (
      <OrgLayout>
        {(path === 'org-login' || orgSession) ? (
          <>
            {path === 'org-login'     && <OrgLogin />}
            {path === 'org-forgot'    && <OrgLogin />}
            {path === 'org-dashboard' && <Dashboard />}
            {path === 'org-create'    && <CreateBolao />}
            {path === 'org-manage'    && <ManageBolao id={params.id} />}
            {path === 'org-results'   && <AdminResults />}
          </>
        ) : (
          <OrgLogin />
        )}
      </OrgLayout>
    );
  }

  // ── FLUXO DO PARTICIPANTE ──
  return (
    <Layout>
      {path === 'home'       && <Home />}
      {path === 'modelo-a'   && <ModeloA />}
      {path === 'my'         && <MyArea />}
      {path === 'perfil'     && <Perfil />}
      {path === 'terms'      && <Terms />}
      {path === 'privacy'    && <Privacy />}
      {path === 'legal'      && <LegalNotice />}
      {path === 'bolao'      && <PublicBolao slug={params.slug} />}
      {path === 'join'       && <JoinBolao slug={params.slug} />}
      {path === 'predict'    && <Predictions slug={params.slug} cotaId={params.cotaId} />}
      {path === 'ranking'    && <Ranking slug={params.slug} />}
      {path === 'my-referrals' && <MyReferrals slug={params.slug} cotaId={params.cotaId} />}
    </Layout>
  );
}
