// app/components/checkout/StepAccordion.tsx
import { ReactNode } from "react";

interface StepAccordionProps {
  step: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function StepAccordion({
  step,
  title,
  open,
  onToggle,
  children,
}: StepAccordionProps) {
  return (
    <div className="border-b">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-5 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-lg font-bold">
          <span className="w-8 h-8 rounded-full border-2 border-primary text-primary bg-white flex items-center justify-center text-sm font-medium leading-none">
            {step}
          </span>
          <span className="text-primary">{title}</span>
        </div>
        <span>{open ? "-" : "+"}</span>
      </button>
      {open && <div className="px-4 py-6 bg-white">{children}</div>}
    </div>
  );
}
