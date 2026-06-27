import { ToolsMenu } from './ToolsMenu';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolsModal = ({ isOpen, onClose }: ToolsModalProps) => {
  return (
    <ToolsMenu
      variant="controlled"
      open={isOpen}
      onOpenChange={(v) => { if (!v) onClose(); }}
    />
  );
};
