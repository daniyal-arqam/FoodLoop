import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { AI_MODES, DEFAULT_AI_MODE, isAiMode } from "./aiModes.js";
import { AiModeNav } from "./AiModeNav.jsx";
import { WasteAdvisorMode } from "./WasteAdvisorMode.jsx";
import { FoodSafetyMode } from "./FoodSafetyMode.jsx";
import { MatchingAgentMode } from "./MatchingAgentMode.jsx";

const PANELS = {
  advisor: WasteAdvisorMode,
  safety: FoodSafetyMode,
  matching: MatchingAgentMode,
};

export function AiPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("mode");
  const mode = isAiMode(requested) ? requested : DEFAULT_AI_MODE;
  const active = AI_MODES.find((item) => item.id === mode);

  function selectMode(nextMode) {
    setParams({ mode: nextMode }, { replace: true });
  }

  return (
    <div className="ai-workspace stack">
      <PageHeader title="FoodLoop AI" description={active?.description} />
      <AiModeNav mode={mode} onChange={selectMode} />
      {AI_MODES.map((item) => {
        const Panel = PANELS[item.id];
        const selected = item.id === mode;
        return (
          <div
            key={item.id}
            id={`ai-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`ai-tab-${item.id}`}
            hidden={!selected}
          >
            {selected ? <h2 className="sr-only">{item.title}</h2> : null}
            <Panel />
          </div>
        );
      })}
    </div>
  );
}
