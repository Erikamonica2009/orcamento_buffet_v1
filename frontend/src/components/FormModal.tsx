import { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function FormModal({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="form-modal-titulo">
      <div className="dialog-box dialog-box-scroll">
        <div className="dialog-header">
          <h2 id="form-modal-titulo">{title}</h2>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
