import { describe, expect, it } from "vitest";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { BACKUP_STRINGS } from "@/lib/i18n/my-carte-strings";

describe("counts of one read naturally", () => {
  it("uses the singular for one dish", () => {
    expect(CAMERA_STRINGS.en.dishesFound(1)).toBe("1 dish found");
    expect(CAMERA_STRINGS.en.dishesFound(3)).toBe("3 dishes found");
    expect(CAMERA_STRINGS.es.dishesFound(1)).toBe("1 plato encontrado");
    expect(DINER_STRINGS.en.showing(1, 1, 0)).toBe("Showing 1 of 1 dish.");
    expect(DINER_STRINGS.es.showing(0, 2, 1)).toBe(
      "Mostrando 0 de 2 platos. 1 oculto por sus filtros.",
    );
  });

  it("uses the French singular for zero and one", () => {
    expect(CAMERA_STRINGS.fr.dishesFound(0)).toBe("0 plat trouvé");
    expect(CAMERA_STRINGS.fr.dishesFound(2)).toBe("2 plats trouvés");
    expect(BACKUP_STRINGS.fr.counts(1, 0, 2)).toBe("1 plat · 0 restaurant · 2 entrées");
  });

  it("words each My Carte backup count on its own", () => {
    expect(BACKUP_STRINGS.en.counts(1, 2, 1)).toBe("1 saved dish · 2 restaurants · 1 diary entry");
    expect(BACKUP_STRINGS.es.counts(2, 1, 0)).toBe("2 platos · 1 restaurante · 0 entradas");
  });
});
