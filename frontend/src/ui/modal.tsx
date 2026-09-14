'use client';

import type { ReactNode } from 'react';
import { Button } from './button';
import { cn } from './styles';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose(): void;
  className?: string;
  actions?: ReactNode;
};

export function Modal({ open, title, description, children, onClose, className, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-6 py-8" role="presentation">
      <section
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn('max-h-[calc(100vh-4rem)] w-full max-w-5xl overflow-y-auto rounded-card border border-border bg-surface-raised p-5 shadow-card sm:p-6', className)}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-7 tracking-tight text-text-primary" id="modal-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-text-muted" id="modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Button aria-label="Close modal" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
