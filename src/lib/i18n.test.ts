import { getStaticPaths, getStaticProps, defaultLocale, locales } from "./i18n";

// Mocks removed to test real file loading
// jest.mock('../messages/en.json', ...);

describe("i18n utils", () => {
  describe("getStaticPaths", () => {
    it("devrait retourner les chemins pour toutes les locales", () => {
      const result = getStaticPaths();
      expect(result.paths).toHaveLength(locales.length);
      expect(result.paths).toEqual(
        expect.arrayContaining([
          { params: { locale: "en" } },
          { params: { locale: "fr" } },
        ])
      );
      expect(result.fallback).toBe(false);
    });
  });

  describe("getStaticProps", () => {
    it("devrait retourner les props pour la locale par défaut si aucune locale fournie", async () => {
      const context = { params: {} };
      const result = await getStaticProps(context);

      expect(result.props).toEqual({
        locale: defaultLocale,
        messages: expect.objectContaining({ Index: expect.any(Object) }),
      });
    });

    it("devrait retourner les props et messages pour une locale spécifique (fr)", async () => {
      const context = { params: { locale: "fr" } };
      const result = await getStaticProps(context);

      expect(result.props).toEqual({
        locale: "fr",
        messages: expect.objectContaining({ Index: expect.any(Object) }),
      });
    });

    it("devrait retourner les props et messages pour une locale spécifique (en)", async () => {
      const context = { params: { locale: "en" } };
      const result = await getStaticProps(context);

      expect(result.props).toEqual({
        locale: "en",
        messages: expect.objectContaining({ Index: expect.any(Object) }),
      });
    });
  });
});
