interface Props {
  open: boolean;
  onClose: () => void;
}

export function TermsDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="termos-titulo">
      <div className="dialog-box dialog-box-scroll">
        <h2 id="termos-titulo">Termo de Cadastro de Usuário</h2>
        <div className="terms-content">
          <h3>1. Identificação e Dados</h3>
          <p>
            Ao criar uma conta, você deve fornecer dados reais, completos e atualizados (como nome, e-mail e CPF).
          </p>
          <p>O uso de dados falsos pode causar o cancelamento da conta.</p>

          <h3>2. Senha e Acesso</h3>
          <p>A sua senha é pessoal e intransferível.</p>
          <p>Você não deve dividir sua senha com outras pessoas.</p>
          <p>Você responde por tudo o que acontece na sua conta.</p>

          <h3>3. Privacidade</h3>
          <p>Os seus dados pessoais são guardados com segurança.</p>
          <p>Usamos suas informações apenas para o funcionamento do sistema e conforme a nossa Política de Privacidade.</p>

          <h3>4. Mudanças no Termo</h3>
          <p>Podemos atualizar este termo quando for necessário.</p>
          <p>O uso contínuo do sistema significa que você aceita as novas regras.</p>
        </div>
        <div className="dialog-actions">
          <button className="btn" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
