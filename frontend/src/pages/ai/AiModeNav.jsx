import { AI_MODES } from "./aiModes.js";

export function AiModeNav({ mode, onChange }) {
  return (
    <div className="ai-mode-nav" role="tablist" aria-label="FoodLoop AI modes">
      {AI_MODES.map((item) => {
        const selected = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`ai-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`ai-panel-${item.id}`}
            className={`ai-mode-tab${selected ? " is-active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
