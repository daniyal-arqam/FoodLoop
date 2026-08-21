import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { AiPage } from "./AiPage.jsx";

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { id: "user-1", name: "Harbour Kitchen", role: "Provider" } }),
}));

vi.mock("../../services/aiService.js", () => ({
  recommendWasteReduction: vi.fn(),
  queryKnowledgeBase: vi.fn(),
  runMatchingAgent: vi.fn(),
}));

import { queryKnowledgeBase, recommendWasteReduction, runMatchingAgent } from "../../services/aiService.js";

function renderWorkspace(path = "/ai") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AiPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("FoodLoop AI workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("separates the three AI modes and defaults to the waste advisor", () => {
    renderWorkspace();
    expect(screen.getByRole("heading", { name: "FoodLoop AI" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Waste Advisor" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Food Safety" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Matching Agent" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("button", { name: "Get recommendations" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask food safety" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run matching agent" })).not.toBeInTheDocument();
    expect(screen.getByText("No recommendations yet")).toBeInTheDocument();
  });

  it("posts surplus context to the advisor and renders structured recommendations", async () => {
    recommendWasteReduction.mockResolvedValue({
      success: true,
      data: {
        advice: {
          situationSummary: "120 servings of prepared meals are left weekly from 7 PM to 9 PM.",
          immediateActions: ["List tonight's surplus on FoodLoop before closing."],
          operationalImprovements: ["Plan smaller evening batches."],
          redistributionSuggestions: ["Offer pickup to verified community kitchens."],
          longTermRecommendations: ["Track this weekly leftover pattern."],
          caveats: ["These are recommendations, not measured waste statistics."],
        },
      },
    });

    renderWorkspace();
    await userEvent.click(screen.getByRole("button", { name: "Get recommendations" }));
    expect(recommendWasteReduction).toHaveBeenCalledWith({
      surplusQuantity: 120,
      foodCategory: "Prepared Meals",
      timePattern: "7 PM - 9 PM",
      frequency: "weekly",
      unit: "servings",
      providerName: "Harbour Kitchen",
      notes: undefined,
    });
    expect(await screen.findByText(/120 servings of prepared meals/)).toBeInTheDocument();
    expect(screen.getByText("Immediate actions")).toBeInTheDocument();
    expect(screen.getByText(/List tonight's surplus/)).toBeInTheDocument();
    expect(screen.getByText(/recommendations, not measured/)).toBeInTheDocument();
  });

  it("shows a loading state while the advisor API request is in flight", async () => {
    let finish;
    recommendWasteReduction.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderWorkspace();
    await userEvent.click(screen.getByRole("button", { name: "Get recommendations" }));
    expect(screen.getByText(/Calling POST \/api\/ai\/recommend/)).toBeInTheDocument();
    finish({
      success: true,
      data: {
        advice: {
          situationSummary: "Loaded from the API.",
          immediateActions: ["List surplus."],
          operationalImprovements: [],
          redistributionSuggestions: [],
          longTermRecommendations: [],
          caveats: [],
        },
      },
    });
    expect(await screen.findByText("Loaded from the API.")).toBeInTheDocument();
  });

  it("shows an advisor error and retries the same API request", async () => {
    recommendWasteReduction
      .mockRejectedValueOnce(new Error("AI advisor is not configured. Set OPENAI_API_KEY."))
      .mockResolvedValueOnce({
        success: true,
        data: {
          advice: {
            situationSummary: "Retry succeeded.",
            immediateActions: ["List the surplus."],
            operationalImprovements: [],
            redistributionSuggestions: [],
            longTermRecommendations: [],
            caveats: [],
          },
        },
      });

    renderWorkspace();
    await userEvent.click(screen.getByRole("button", { name: "Get recommendations" }));
    expect(await screen.findByRole("heading", { name: "Request failed" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Retry succeeded.")).toBeInTheDocument();
    expect(recommendWasteReduction).toHaveBeenCalledTimes(2);
  });

  it("asks the food safety assistant and shows grounded sources", async () => {
    queryKnowledgeBase.mockResolvedValue({
      success: true,
      data: {
        answer: "Confirm holding conditions and a short pickup window.",
        sources: [{ title: "Redistributing prepared food", path: "prepared-food-redistribution.md", chunkId: "p#0" }],
      },
    });

    renderWorkspace("/ai?mode=safety");
    expect(screen.getByText("No grounded answers yet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ask food safety" }));
    expect(queryKnowledgeBase).toHaveBeenCalledWith(
      "What should we consider before redistributing prepared food?"
    );
    expect(await screen.findByText(/Confirm holding conditions/)).toBeInTheDocument();
    expect(screen.getByText(/prepared-food-redistribution.md/)).toBeInTheDocument();
    expect(screen.getByText("Sources")).toBeInTheDocument();
  });

  it("runs the matching agent and shows live tool calls, scores, and explanations", async () => {
    runMatchingAgent.mockResolvedValue({
      success: true,
      data: {
        answer: "Recommended organization: Karachi Food Bank (score 0.8125).",
        toolCalls: [
          {
            name: "find_available_food",
            ok: true,
            durationMs: 12,
            arguments: { category: "Prepared" },
            listingIds: ["listing-veg-1"],
          },
          { name: "find_organizations", ok: true, durationMs: 9, organizationIds: ["org-kitchen-1"] },
          { name: "calculate_match_score", ok: true, durationMs: 8, score: 0.8125 },
        ],
        recommendations: [
          {
            listingId: "listing-veg-1",
            listingName: "Vegetarian meal",
            listingQuantity: 30,
            listingUnit: "servings",
            organizationId: "org-kitchen-1",
            organizationName: "Karachi Food Bank",
            score: 0.8125,
            distanceKm: 0.012,
            quantityFit: 0.75,
            urgency: 0.9,
            eligible: true,
            why: "Category matches an organization need. Distance 0.012 km.",
          },
        ],
      },
    });

    renderWorkspace("/ai?mode=matching");
    expect(screen.getByText("No agent activity yet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Run matching agent" }));
    expect(runMatchingAgent).toHaveBeenCalledWith(
      "Find organizations that could use the available vegetarian meals."
    );
    expect(await screen.findByText(/Karachi Food Bank \(score 0.8125\)/)).toBeInTheDocument();
    expect(screen.getByText("Agent activity")).toBeInTheDocument();
    expect(screen.getByText("1. find_available_food")).toBeInTheDocument();
    expect(screen.getByText(/listing-veg-1/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Karachi Food Bank" })).toBeInTheDocument();
    expect(screen.getByText("Match score")).toBeInTheDocument();
    expect(screen.getAllByText("0.8125").length).toBeGreaterThan(0);
    expect(screen.getByText(/Category matches an organization need/)).toBeInTheDocument();
    expect(screen.getByText("0.012 km")).toBeInTheDocument();
  });

  it("switches modes from the workspace tabs", async () => {
    renderWorkspace();
    await userEvent.click(screen.getByRole("tab", { name: "Matching Agent" }));
    expect(screen.getByRole("button", { name: "Run matching agent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Get recommendations" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Food Safety" }));
    expect(screen.getByRole("button", { name: "Ask food safety" })).toBeInTheDocument();
  });
});
