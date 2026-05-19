"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ArchiveRecipeModalProps {
  isOpen: boolean;
  recipeName: string;
  bookName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ArchiveRecipeModal({
  isOpen,
  recipeName,
  bookName,
  onClose,
  onConfirm,
  loading = false,
}: ArchiveRecipeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold mb-2">Quitar receta del libro</DialogTitle>
          <DialogDescription>
            Vas a quitar <span className="font-medium text-foreground">&ldquo;{recipeName}&rdquo;</span> del libro <span className="font-medium text-foreground">&ldquo;{bookName}&rdquo;</span>.
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              No aparecerá en el libro impreso. Es reversible desde Operations &gt; Archived.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-4">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="order-1 sm:order-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Quitando..." : "Quitar del libro"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
