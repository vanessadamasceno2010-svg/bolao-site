import { Card } from '../components/Layout';
import { navigate } from '../lib/router';

export function Terms() {
  return (
    <LegalPage title="Termos de Uso">
      <Section title="1. Aceitação dos Termos">
        Ao acessar e utilizar a plataforma BolãoCopa 2026 ("Plataforma"), você concorda
        com estes Termos de Uso. Se não concordar, não utilize a Plataforma.
      </Section>

      <Section title="2. Descrição do Serviço">
        A Plataforma permite que organizadores criem bolões de previsões esportivas
        para a Copa do Mundo FIFA 2026, onde participantes fazem palpites sobre resultados
        de jogos. <strong>Não se trata de jogo de azar, apostas ou loteria.</strong> Os
        bolões são competições de habilidade baseadas em previsões esportivas entre amigos
        ou grupos privados.
      </Section>

      <Section title="3. Cadastro e Participação">
        <ul className="list-disc pl-5 space-y-1">
          <li>O participante deve ter 18 anos ou mais.</li>
          <li>Os dados fornecidos devem ser verdadeiros e atualizados.</li>
          <li>Cada participante é responsável por manter suas credenciais seguras.</li>
          <li>A participação se dá mediante pagamento da cota definida pelo organizador.</li>
        </ul>
      </Section>

      <Section title="4. Pagamentos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Os pagamentos são processados via gateway de pagamento terceiro (PushinPay), que atua como intermediador PIX.</li>
          <li>Não armazenamos dados de cartão de crédito.</li>
          <li>Após confirmação do pagamento, a inscrição é irreversível — não há reembolso, salvo cancelamento do bolão pelo organizador.</li>
          <li>Os valores são mantidos em custódia pelo gateway até a distribuição dos prêmios.</li>
        </ul>
      </Section>

      <Section title="5. Comissão do Organizador">
        O organizador do bolão recebe uma comissão (entre 5% e 15%) sobre cada cota vendida,
        conforme definido na criação do bolão. Este valor é descontado automaticamente e
        repassado ao organizador.
      </Section>

      <Section title="6. Distribuição de Prêmios">
        <ul className="list-disc pl-5 space-y-1">
          <li>Os prêmios são distribuídos conforme a classificação final e as porcentagens definidas na criação do bolão.</li>
          <li>A distribuição ocorre automaticamente após o encerramento de todos os jogos previstos.</li>
          <li>Em caso de empate na pontuação, critérios de desempate são: placares exatos {">"} vencedores corretos {">"} empates corretos.</li>
          <li>O pagamento do prêmio será realizado via PIX em até 5 dias úteis após o fim da Copa.</li>
        </ul>
      </Section>

      <Section title="7. Responsabilidades">
        <ul className="list-disc pl-5 space-y-1">
          <li>A Plataforma não se responsabiliza por palpites não enviados dentro do prazo.</li>
          <li>Resultados dos jogos são obtidos de fontes oficiais via API de terceiros.</li>
          <li>Em caso de cancelamento de jogos pela FIFA, os pontos daquele jogo não são computados.</li>
        </ul>
      </Section>

      <Section title="8. Propriedade Intelectual">
        Todo conteúdo da Plataforma é protegido por direitos autorais.
        Marcas da FIFA e Copa do Mundo são propriedade de seus respectivos titulares.
        A Plataforma não é afiliada à FIFA.
      </Section>

      <Section title="9. Modificações">
        Reservamo-nos o direito de alterar estes Termos a qualquer momento.
        Alterações serão comunicadas via e-mail e publicadas nesta página.
      </Section>

      <Section title="10. Foro">
        Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da
        comarca de São Paulo/SP para dirimir qualquer controvérsia.
      </Section>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Política de Privacidade (LGPD)">
      <Section title="1. Dados Coletados">
        Coletamos as seguintes informações:
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Nome completo</strong> — para identificação no bolão</li>
          <li><strong>E-mail</strong> — para comunicação e comprovantes</li>
          <li><strong>Telefone/WhatsApp</strong> — para notificações</li>
          <li><strong>Chave PIX</strong> (organizador) — para repasse de comissão e prêmios</li>
          <li><strong>Dados de pagamento</strong> — processados pelo gateway (não armazenamos)</li>
        </ul>
      </Section>

      <Section title="2. Base Legal (Art. 7, LGPD)">
        O tratamento dos seus dados tem como bases legais:
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Execução de contrato</strong> (Art. 7, V) — para prestação do serviço</li>
          <li><strong>Consentimento</strong> (Art. 7, I) — para envio de notificações</li>
          <li><strong>Legítimo interesse</strong> (Art. 7, IX) — para melhorar a plataforma</li>
        </ul>
      </Section>

      <Section title="3. Finalidade do Tratamento">
        Seus dados são usados para:
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Registrar sua participação no bolão</li>
          <li>Processar pagamentos e emitir comprovantes</li>
          <li>Enviar notificações sobre o bolão (resultados, ranking, prazos)</li>
          <li>Distribuir prêmios aos vencedores</li>
        </ul>
      </Section>

      <Section title="4. Compartilhamento de Dados">
        Seus dados podem ser compartilhados com:
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Gateway de pagamento (PushinPay) — para processar transações PIX</li>
          <li>Provedor de e-mail (SendGrid/Resend) — para enviar notificações</li>
          <li>Organizador do bolão — nome e posição no ranking (dados públicos dentro do bolão)</li>
        </ul>
        <strong>Não vendemos seus dados para terceiros.</strong>
      </Section>

      <Section title="5. Retenção de Dados">
        Seus dados são mantidos durante a vigência do bolão e por até 6 meses após
        a distribuição dos prêmios, para fins de comprovação fiscal. Após este período,
        são excluídos permanentemente.
      </Section>

      <Section title="6. Seus Direitos (Art. 18, LGPD)">
        Você tem direito a:
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Confirmar a existência de tratamento dos seus dados</li>
          <li>Acessar, corrigir ou excluir seus dados</li>
          <li>Revogar consentimento para notificações</li>
          <li>Portabilidade dos dados</li>
          <li>Solicitar anonimização dos dados</li>
        </ul>
        Para exercer esses direitos, entre em contato: <strong>privacidade@bolaocopa.com.br</strong>
      </Section>

      <Section title="7. Segurança">
        Utilizamos criptografia TLS/SSL em todas as comunicações, autenticação JWT,
        e os dados de pagamento são processados em ambiente PCI-DSS compliant
        pelo gateway de pagamento.
      </Section>

      <Section title="8. Cookies">
        Utilizamos cookies essenciais para funcionamento da plataforma (autenticação
        e preferências). Não utilizamos cookies de rastreamento ou publicidade.
      </Section>

      <Section title="9. Encarregado de Dados (DPO)">
        O encarregado pelo tratamento de dados pessoais pode ser contatado em:
        <br /><strong>dpo@bolaocopa.com.br</strong>
      </Section>
    </LegalPage>
  );
}

export function LegalNotice() {
  return (
    <LegalPage title="Aviso Legal — Bolões no Brasil">
      <Section title="Natureza dos Bolões">
        <p className="mb-3">
          Os bolões oferecidos nesta plataforma são <strong>competições de previsão esportiva
          baseadas em habilidade</strong>, onde os participantes fazem palpites sobre
          resultados de jogos de futebol.
        </p>
        <p className="mb-3">
          <strong>Não se trata de jogo de azar, aposta esportiva ou loteria.</strong> A
          diferença fundamental é que nos bolões de previsão, o resultado depende do
          conhecimento e análise do participante (habilidade), não do acaso.
        </p>
      </Section>

      <Section title="Legislação Brasileira Aplicável">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Lei nº 13.756/2018:</strong> Regulamenta apostas esportivas no Brasil.
            Bolões entre amigos/grupos privados com premiação são permitidos quando não
            envolvem intermediação profissional de apostas.
          </li>
          <li>
            <strong>Lei nº 14.790/2023:</strong> Marco regulatório das apostas de quota fixa.
            Bolões de previsão entre participantes privados são distintos de apostas
            de quota fixa e não se enquadram na regulamentação da Secretaria de Prêmios
            e Apostas (SPA).
          </li>
          <li>
            <strong>Código Penal (Art. 50-58):</strong> Proíbe jogos de azar. Bolões de
            previsão esportiva por habilidade não se classificam como jogos de azar.
          </li>
        </ul>
      </Section>

      <Section title="Recomendações">
        <ul className="list-disc pl-5 space-y-2">
          <li>Organize bolões apenas entre conhecidos (amigos, família, colegas de trabalho).</li>
          <li>Mantenha valores de cota razoáveis e proporcionais ao grupo.</li>
          <li>Todos os participantes devem ter 18 anos ou mais.</li>
          <li>Consulte um advogado para bolões de alto valor ou grande número de participantes.</li>
          <li>Declare eventuais ganhos no Imposto de Renda como "outros rendimentos".</li>
        </ul>
      </Section>

      <Section title="Tributação">
        <p className="mb-3">
          Prêmios recebidos em bolões privados devem ser declarados no Imposto de Renda
          Pessoa Física como "Rendimentos Sujeitos à Tributação Exclusiva/Definitiva"
          ou "Outros Rendimentos", conforme orientação da Receita Federal.
        </p>
        <p>
          <strong>Recomendamos fortemente</strong> consultar um contador para orientação
          fiscal específica sobre os valores recebidos.
        </p>
      </Section>

      <Section title="Limitação de Responsabilidade">
        A plataforma atua como <strong>ferramenta tecnológica</strong> para facilitar a
        organização de bolões entre grupos privados. Não nos responsabilizamos pelo uso
        indevido da plataforma ou por conflitos entre participantes e organizadores.
      </Section>
    </LegalPage>
  );
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm mb-3">← Início</button>
      <Card className="p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-black mb-2">{title}</h1>
        <p className="text-xs text-slate-500 mb-8">Última atualização: Janeiro 2026</p>
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          {children}
        </div>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
