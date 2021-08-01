import {
  parseURL,
  parseContentState,
  encodeContentState,
  encodeLink,
  ContentStateError,
  extractManifests,
} from "./index.js";
import "regenerator-runtime/runtime";

describe("content-state.js", () => {
  let basicExample;
  let basicJSON, minimalJSON, multiJSON, minimalAnnotation;

  function encode(data) {
    return encodeContentState(data);
  }

  beforeEach(() => {
    basicExample =
      "https://example.com/?iiif-content=https://example.com/manifest/1";
    basicJSON = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: "https://example.org/Annotation-server/bookmarks/b1",
      type: "Annotation",
      motivation: ["contentState"],
      target: {
        id: "https://example.org/iiif/item1/manifest",
        type: "Manifest",
      },
    };
    minimalJSON = {
      id: "https://example.org/iiif/item1/manifest",
      type: "Manifest",
    };
    minimalAnnotation = {
      id: "https://example.org/iiif/item1/manifest",
      type: "Annotation",
    };
    multiJSON = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: "https://example.org/import/3",
      type: "Annotation",
      motivation: "contentState",
      target: [
        {
          id: "https://example.org/iiif/item1/canvas37",
          type: "Canvas",
          partOf: [
            {
              id: "https://example.org/iiif/item1/manifest",
              type: "Manifest",
            },
          ],
        },
        {
          id: "https://example.org/iiif/item2/canvas99",
          type: "Canvas",
          partOf: [
            {
              id: "https://example.org/iiif/item2/manifest",
              type: "Manifest",
            },
          ],
        },
      ],
    };
    fetch.resetMocks();
  });

  describe("encodeLink", () => {
    let testJSON, result;
    beforeEach(() => {
      testJSON = {
        id: "https://example.org/object1/canvas7#xywh=1000,2000,1000,2000",
        type: "Canvas",
        partOf: [
          { id: "https://example.org/object1/manifest", type: "Manifest" },
        ],
      };
      result =
        "JTdCJTIyaWQlMjI6JTIyaHR0cHM6Ly9leGFtcGxlLm9yZy9vYmplY3QxL2NhbnZhczcjeHl3aD0xMDAwLDIwMDAsMTAwMCwyMDAwJTIyLCUyMnR5cGUlMjI6JTIyQ2FudmFzJTIyLCUyMnBhcnRPZiUyMjolNUIlN0IlMjJpZCUyMjolMjJodHRwczovL2V4YW1wbGUub3JnL29iamVjdDEvbWFuaWZlc3QlMjIsJTIydHlwZSUyMjolMjJNYW5pZmVzdCUyMiU3RCU1RCU3RA";
    });
    it("encodeContentState works with JSON", () => {
      expect(encodeContentState(testJSON)).toEqual(result);
    });
    it("encodeLink works with testJSON", () => {
      const urlResult = `http://example.com/?iiif-content=${result}`;
      expect(encodeLink("http://example.com", testJSON)).toEqual(urlResult);
    });
    it("encodeLink works with existing ", () => {
      const urlResult = `http://example.com/?test=a&iiif-content=${result}`;
      expect(encodeLink("http://example.com/?test=a", testJSON)).toEqual(
        urlResult
      );
    });
  });

  it("handles no query params", async () => {
    await expect(parseURL()).rejects.toThrow(ContentStateError);
  });
  it("handles an empty object", async () => {
    await expect(parseURL("")).rejects.toThrow(ContentStateError);
  });
  it("handles no iiif-content", async () => {
    const badExample = "https://example.com/?test=key";
    await expect(parseURL(badExample)).rejects.toThrow(ContentStateError);
  });
  it("handles the base URL structure", async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: "Manifest" }));
    const val = await parseURL(basicExample);
    expect(val).toMatchObject({
      manifests: ["https://example.com/manifest/1"],
    });
  });
  it("fails on non-URL strings", async () => {
    const badExample = "https://example.com/?iiif-content=notAUrl";

    await expect(parseURL(badExample)).rejects.toThrow(ContentStateError);
  });
  it("extracts the manifest for simple examples", async () => {
    await expect(parseContentState(encode(basicJSON))).resolves.toMatchObject({
      target: { id: "https://example.org/iiif/item1/manifest" },
    });
  });

  it("extracts the manifest for simple examples", async () => {
    await expect(parseContentState(encode(minimalJSON))).resolves.toMatchObject(
      {
        target: { id: "https://example.org/iiif/item1/manifest" },
      }
    );
  });
  it("handles multiple motivations", async () => {
    basicJSON.motivation = ["commenting", "contentState"];
    await expect(parseContentState(encode(basicJSON))).resolves.toMatchObject({
      target: { id: "https://example.org/iiif/item1/manifest" },
    });
  });
  it("handles multiple contexts", async () => {
    basicJSON["@context"] = [
      "http://iiif.io/api/presentation/3/context.json",
      "otherContext",
    ];
    await expect(parseContentState(encode(basicJSON))).resolves.toMatchObject({
      target: { id: "https://example.org/iiif/item1/manifest" },
    });
  });

  describe("Fetching Resources", () => {
    it("validates the manifest", async () => {
      fetch.mockResponseOnce(JSON.stringify({ type: "Manifest" }));
      await expect(parseURL(basicExample));
      expect(fetch.mock.calls.length).toEqual(1);
      expect(fetch.mock.calls[0][0]).toEqual("https://example.com/manifest/1");
    });
    it("validates linked annotations", async () => {
      fetch.mockResponseOnce(JSON.stringify(basicJSON));
      const val = await parseContentState(basicExample);
      expect(fetch.mock.calls.length).toEqual(1);
      expect(val).toMatchObject(basicJSON);
    });
  });

  describe("Multi-targets", () => {
    it("extracts manifests from multiJSON", async () => {
      const allManifests = [
        "https://example.org/iiif/item1/manifest",
        "https://example.org/iiif/item2/manifest",
      ];
      const val = await parseContentState(encode(multiJSON));
      expect(extractManifests(val)).toEqual(
        expect.arrayContaining(allManifests)
      );
    });
    it("dedupes manifests from multiJSON", async () => {
      const allManifests = ["https://example.org/iiif/item1/manifest"];
      multiJSON.target[1].partOf[0].id =
        "https://example.org/iiif/item1/manifest";
      const val = await parseContentState(encode(multiJSON));
      expect(extractManifests(val)).toEqual(
        expect.arrayContaining(allManifests)
      );
    });
  });

  describe("Annotation Expansion", () => {
    it("expands minimalJSON", async () => {
      delete basicJSON.id;
      const val = await parseContentState(encode(minimalJSON));
      expect(val).toMatchObject(basicJSON);
    });
    it("expands minimalAnnotation", async () => {
      delete basicJSON.id;
      basicJSON.target = minimalAnnotation;
      const val = await parseContentState(encode(minimalAnnotation));
      expect(val).toMatchObject(basicJSON);
    });
    it("expands basic JSON", async () => {
      const val = await parseContentState(encode(basicJSON));
      expect(val).toMatchObject(basicJSON);
    });
    it("expands multi JSON", async () => {
      const val = await parseContentState(encode(multiJSON));
      expect(val).toMatchObject(multiJSON);
    });
    it("adds back in context", async () => {
      delete basicJSON["@context"];
      const val = await parseContentState(encode(basicJSON));
      expect(val).toMatchObject(basicJSON);
    });
  });

  describe("Validation tests", () => {
    it("throws if annotation context is wrong", async () => {
      basicJSON["@context"] = "banana";
      await expect(parseContentState(encode(basicJSON))).rejects.toThrow(
        ContentStateError
      );
    });
    it("throws if no context in context array is correct", async () => {
      basicJSON["@context"] = ["banana", "apple"];
      await expect(parseContentState(encode(basicJSON))).rejects.toThrow(
        ContentStateError
      );
    });
    it("throws if context is object", async () => {
      basicJSON["@context"] = {};
      await expect(parseContentState(encode(basicJSON))).rejects.toThrow(
        ContentStateError
      );
    });
    it("throws if target has no ID", async () => {
      delete basicJSON.target.id;
      expect(parseContentState(encode(basicJSON))).rejects.toThrow(
        ContentStateError
      );
    });
    it("throws if no target", async () => {
      delete basicJSON.target;
      await expect(parseContentState(encode(basicJSON))).rejects.toThrow(
        ContentStateError
      );
    });
  });
});
