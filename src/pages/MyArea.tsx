import { useEffect } from 'react';
import { navigate } from '../lib/router';

// "Minha Área" foi unificada com o "Meu Perfil" (login por usuário/senha).
export function MyArea() {
  useEffect(() => { navigate('/perfil'); }, []);
  return null;
}
