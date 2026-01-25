import { useEffect, type ReactNode } from 'react';

type Props = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
};

export default function Modal({ title, isOpen, onClose, children }: Props) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className="modal" onMouseDown={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ fontWeight: 800 }}>{title}</div>
                    <button className="btn" onClick={onClose}>Zamknij</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
