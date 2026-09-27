import { expect, it, vi } from "vitest";
import { TableChangeRejectedError, TableSync } from "@/lib/table-sync";

type Lines = Record<string, number>;

/** A table that adds up changes like the database does, remembering the ids it has counted. */
function setup(start: Lines = {}) {
  const table: Lines = { ...start };
  const counted = new Set<string>();
  let next = 0;
  const io = {
    read: vi.fn(async () => ({ lines: { ...table }, allergies: {} })),
    change: vi.fn(async (line: string, by: number, id: string) => {
      if (!counted.has(id)) {
        counted.add(id);
        const quantity = Math.min(20, Math.max(0, (table[line] ?? 0) + by));
        if (quantity) table[line] = quantity;
        else delete table[line];
      }
      return { ...table };
    }),
    newId: () => `change${++next}`,
    allergies: vi.fn(async () => ({})),
    showLines: vi.fn(),
    showAllergies: vi.fn(),
    status: vi.fn(),
    online: () => true,
    error: vi.fn(),
  };
  const shown = () => io.showLines.mock.calls.at(-1)?.[0];
  return { io, table, shown, sync: new TableSync(io, start) };
}

it("sends how much each tap changed, one at a time, and keeps later taps visible", async () => {
  const { sync, io, shown } = setup();
  let release!: () => void;
  io.change.mockImplementationOnce(async (line, by) => {
    await new Promise<void>((resolve) => (release = resolve));
    return { [line]: by };
  });
  sync.quantity("dish", 1);
  await Promise.resolve();
  sync.quantity("dish", 2);
  sync.quantity("dish", 3);
  expect(shown()).toEqual({ dish: 3 });
  expect(io.change).toHaveBeenCalledTimes(1);
  release();
  await sync.flush();
  expect(io.change.mock.calls.map((call) => [call[0], call[1]])).toEqual([
    ["dish", 1],
    ["dish", 2],
  ]);
});

it("counts both phones when two diners add the same dish at once", async () => {
  const { sync, table, shown } = setup({ dish: 1 });
  // Another phone adds one before this phone has heard about it.
  table.dish = 2;
  sync.quantity("dish", 2);
  await sync.flush();
  expect(table.dish).toBe(3);
  expect(shown()).toEqual({ dish: 3 });
});

it("starts from the order the table was created with", async () => {
  const { sync, io } = setup({ dish: 2 });
  sync.quantity("dish", 3);
  await sync.flush();
  expect(io.change).toHaveBeenCalledWith("dish", 1, "change1");
});

it("sends a failed change again with the same id, so it's never counted twice", async () => {
  const { sync, io, table } = setup();
  // The table counts the change, but the reply is lost on the way back.
  io.change.mockImplementationOnce(async (line, by, id) => {
    await io.change.getMockImplementation()!(line, by, id);
    throw new Error("network");
  });
  sync.quantity("dish", 1);
  await expect(sync.flush()).rejects.toThrow();
  await sync.refresh();
  expect(io.change.mock.calls.map((call) => call[2])).toEqual(["change1", "change1"]);
  expect(table).toEqual({ dish: 1 });
});

it("keeps quantities between 0 and 20", async () => {
  const { sync, io, shown } = setup({ dish: 20 });
  sync.quantity("dish", 21);
  expect(io.change).not.toHaveBeenCalled();
  sync.quantity("dish", 0);
  await sync.flush();
  expect(io.change).toHaveBeenCalledWith("dish", -20, "change1");
  expect(shown()).toEqual({});
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
  let resolve!: (v: { lines: Lines; allergies: Record<string, never> }) => void;
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

it("keeps failed changes for when the phone reconnects, and ignores replies after leaving", async () => {
  const { sync, io } = setup();
  io.change.mockRejectedValueOnce(new Error("network"));
  sync.quantity("dish", 2);
  await expect(sync.flush()).rejects.toThrow();
  await sync.refresh();
  expect(io.change).toHaveBeenCalledTimes(2);
  sync.stop();
  io.showLines.mockClear();
  await sync.refresh();
  expect(io.showLines).not.toHaveBeenCalled();
});

it("drops a change the table turns down, so later changes still go through", async () => {
  const { sync, io } = setup({ gone: 1 });
  // Adding more of a dish the owner has since unconfirmed, then adding another dish.
  io.change.mockRejectedValueOnce(new TableChangeRejectedError("That dish can't be added."));
  sync.quantity("gone", 2);
  sync.quantity("dish", 2);
  await sync.flush();
  expect(io.change.mock.calls.map((call) => call[0])).toEqual(["gone", "dish"]);
  expect(io.status).toHaveBeenLastCalledWith("synced");
  await sync.refresh();
  expect(io.change).toHaveBeenCalledTimes(2);
  expect(io.read).toHaveBeenCalledTimes(1);
});
