"use client";

// 設定画面などで使う汎用ON/OFFスイッチ。iOS風の丸いつまみが左右にスライドする。
export default function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 flex-shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? "#4a3f86" : "#d4d4d8" }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]"
        style={{ left: checked ? "22px" : "2px" }}
      />
    </button>
  );
}
