import { expect, it, vi } from "vitest";
import { TableChangeRejectedError, TableSync } from "@/lib/table-sync";
function setup() {
  const io = {
    read: vi.fn(async () => ({ lines: {}, allergies: {} })),
    line: vi.fn(async (_line: string, quantity: number) => ({ dish: quantity })),
    allergies: vi.fn(async () => ({})),
    showLines: vi.fn(),
    showAllergies: vi.fn(),
    status: vi.fn(),
    online: () => true,
    error: vi.fn(),
  };
  return { io, sync: new TableSync(io) };
}
it("serializes rapid changes and keeps latest intent visible", async () => {
  const { sync, io } = setup();
  let resolve!: (v: { dish: number }) => void;
  io.line.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  sync.quantity("dish", 1);
  await Promise.resolve();
  sync.quantity("dish", 2);
  sync.quantity("dish", 3);
  expect(io.line).toHaveBeenCalledTimes(1);
  resolve({ dish: 1 });
  await sync.flush();
  expect(io.line.mock.calls.map((c) => c[1])).toEqual([1, 3]);
  expect(io.showLines.mock.calls.every((c) => c[0].dish === 3)).toBe(true);
});
it("retries failed allergy writes rather than treating them as saved", async () => {
  const { sync, io } = setup();
  io.allergies.mockRejectedValueOnce(new Error("network"));
  const entry = { label: "A", avoid: ["milk"], alsoAvoid: [], severity: "allergy" } as never;
  await expect(sync.share("person", entry)).rejects.toThrow();
  expect(io.status).toHaveBeenLastCalledWith("failed");
  await sync.refresh();
  expect(io.allergies).toHaveBeenCalledTimes(2);
  expect(io.status).toHaveBeenLastCalledWith("synced");
});
it("does not apply a read that started before a local edit", async () => {
  const { sync, io } = setup();
  let resolve!: (v: { lines: Record<string, never>; allergies: Record<string, never> }) => void;
  io.read.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const read = sync.refresh();
  await Promise.resolve();
  sync.quantity("dish", 2);
  await sync.flush();
  io.showLines.mockClear();
  resolve({ lines: {}, allergies: {} });
  await read;
  expect(io.showLines).not.toHaveBeenCalled();
});
it("retains failed quantities for reconnect and ignores responses after leaving", async () => {
  const { sync, io } = setup();
  io.line.mockRejectedValueOnce(new Error("network"));
  sync.quantity("dish", 2);
  await expect(sync.flush()).rejects.toThrow();
  await sync.refresh();
  expect(io.line).toHaveBeenCalledTimes(2);
  sync.stop();
  io.showLines.mockClear();
  await sync.refresh();
  expect(io.showLines).not.toHaveBeenCalled();
});
it("drops a change the table turns down, so later changes still go through", async () => {
  const { sync, io } = setup();
  // Taking off a dish the owner has since unconfirmed, then adding another.
  io.line.mockRejectedValueOnce(new TableChangeRejectedError("That dish can't be added."));
  sync.quantity("gone", 0);
  sync.quantity("dish", 2);
  await sync.flush();
  expect(io.line.mock.calls.map((c) => c[0])).toEqual(["gone", "dish"]);
  expect(io.status).toHaveBeenLastCalledWith("synced");
  await sync.refresh();
  expect(io.line).toHaveBeenCalledTimes(2);
  expect(io.read).toHaveBeenCalledTimes(1);
});
