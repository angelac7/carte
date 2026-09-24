// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { shrinkImage } from "@/lib/image";
import { useSpeechInput } from "@/lib/use-speech-input";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("releases the decoded bitmap even when no resizing is needed", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 100, close }));
  const file = new File(["image"], "image.jpg", { type: "image/jpeg" });
  expect(await shrinkImage(file)).toBe(file);
  expect(close).toHaveBeenCalledOnce();
});
it("rejects failed canvas conversion instead of uploading the text null", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", async () => ({ width: 3000, height: 3000, close }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(null));
  await expect(
    shrinkImage(new File(["image"], "image.jpg", { type: "image/jpeg" })),
  ).rejects.toThrow("conversion failed");
  expect(close).toHaveBeenCalledOnce();
});
it("stops the microphone and drops late transcripts when chat closes", () => {
  const abort = vi.fn();
  const start = vi.fn();
  class Recognition {
    lang = "";
    interimResults = false;
    maxAlternatives = 1;
    onresult: unknown = null;
    onend: unknown = null;
    onerror: unknown = null;
    start = start;
    stop = vi.fn();
    abort = abort;
  }
  vi.stubGlobal("SpeechRecognition", Recognition);
  const onText = vi.fn();
  const { result, rerender, unmount } = renderHook(
    ({ open }) => useSpeechInput("en-US", onText, open),
    { initialProps: { open: true } },
  );
  act(() => result.current.start());
  expect(result.current.listening).toBe(true);
  rerender({ open: false });
  expect(abort).toHaveBeenCalled();
  expect(result.current.listening).toBe(false);
  rerender({ open: true });
  expect(result.current.listening).toBe(false);
  act(() => result.current.start());
  expect(start).toHaveBeenCalledTimes(2);
  unmount();
  expect(abort).toHaveBeenCalledTimes(2);
});
