// app/(admin)/admin/delete/components/DeletePreviewSheet.tsx (STUB — Task 11 lo reemplaza)
"use client";
import type { DeletableEntity } from '@/lib/admin/deletion/types';

interface Props {
  entityType: DeletableEntity;
  entityId: string;
  onClose: () => void;
  onTrashed: () => void;
}

export default function DeletePreviewSheet(_props: Props) {
  return null;
}
