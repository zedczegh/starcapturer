
import React from "react";
import { Minus } from "lucide-react";

interface MiniRemoveButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const MiniRemoveButton: React.FC<MiniRemoveButtonProps> = ({ onClick }) => (
  <button
    type="button"
    title="Remove"
    className="absolute -top-2 -left-2 z-20 bg-red-600 hover:bg-red-700 w-7 h-7 flex items-center justify-center rounded-full shadow-md border-2 border-white transition"
    onClick={onClick}
    aria-label="Remove this location"
  >
    <Minus className="text-white" />
  </button>
);

export default MiniRemoveButton;
