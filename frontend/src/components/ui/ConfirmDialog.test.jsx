import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog.jsx";

describe("ConfirmDialog", () => {
  it("asks for confirmation before running a destructive action", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Deactivate user"
        message="Deactivate Ayesha Khan?"
        confirmLabel="Deactivate"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Deactivate Ayesha Khan?");
    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancels without confirming", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Expire listing"
        message="Mark bread as expired?"
        confirmLabel="Expire listing"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
