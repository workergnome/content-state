const preziContext = "http://iiif.io/api/presentation/3/context.json";

/**
 * This is the custom Error class we're assuming we'll throw on parse errors.
 */
export class ContentStateError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContentStateError";
  }
}

/**
 * Given a contentState annotation, add back in the context if it's missing.
 * Given a mimimal target-only contentState, assume that it's a target
 * and wrap it in the annotation.
 *
 * @param  {Object} annotation the annotation to expand
 * @return {Object}            the annotation with any transformations applied
 *
 */
function expandAnnotation(annotation) {
  //AutoExpander for target-only annotations

  if (isContentStateAnnotation(annotation)) {
    if (!annotation["@context"]) {
      annotation["@context"] = "http://iiif.io/api/presentation/3/context.json";
    }
    return annotation;
  }
  if (
    annotation.type &&
    ["Annotation", "Collection", "Manifest", "Canvas", "Range"].includes(
      annotation.type
    )
  ) {
    annotation = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      type: "Annotation",
      motivation: ["contentState"],
      target: annotation,
    };
  }

  return annotation;
}

/**
 * Given an annotation, confirm that it has the correct context and that it has
 * a target property.  Will throw errors if it is not.
 *
 * @param  {Object} annotation the annotation to expand
 */
function validateAnnotation(annotation) {
  const context = annotation["@context"];
  if (typeof context === "string") {
    if (context != preziContext) {
      throw new ContentStateError("Incorrect context present in annotation");
    }
  } else if (Array.isArray(context)) {
    if (!context.includes(preziContext)) {
      throw new ContentStateError("Incorrect contexts present in annotation");
    }
  } else {
    throw new ContentStateError(
      "context value is not valid JSON-LD" + JSON.stringify(annotation, null, 2)
    );
  }

  if (!annotation.target)
    throw new ContentStateError("No annotation target present");
}

/**
 * Inspect the motivation of an annotation and see if it contains
 * the "contentState" motivation.
 *
 * @param  {Object} annotation the annotation to inspect
 * @return {Boolean} true if it's a contentState Annotation, false if not.
 */
function isContentStateAnnotation(annotation) {
  // Validate motivations
  if (!annotation.motivation) return false;
  // throw new Error("No annotation motivation present");
  if (
    typeof annotation.motivation == "string" &&
    annotation.motivation != "contentState"
  ) {
    return false;
    //    throw new Error("motivation is not contentState");
  }
  if (
    Array.isArray(annotation.motivation) &&
    !annotation.motivation.includes("contentState")
  ) {
    return false;
  }
  return true;
}

function extractManifests(annotation) {
  let targets;

  if (Array.isArray(annotation.target)) {
    targets = annotation.target;
  } else if (typeof annotation.target === "object") {
    targets = [annotation.target];
  } else {
    throw new ContentStateError("Annotation target is invalid");
  }
  const manifestIds = targets.map((target) => {
    if (target.type == "Annotation") {
      return null;
    } else if (target.type == "Collection") {
      return null;
    } else if (target.type == "Manifest") {
      if (!target.id) {
        throw new ContentStateError("No id available for Manifest target.");
      }
      return target.id;
    } else if (["Canvas", "Range"].includes(target.type)) {
      return target.partOf.map((part) => part.id);
    } else {
      throw new ContentStateError("unknown target type");
    }
  });

  return [...new Set(manifestIds.flat())];
}

async function checkURLType(input) {
  let annotation;
  const response = await fetch(input);
  const data = await response.json();
  if (data.type == "Manifest" || data["@type"] == "sc:Manifest") {
    annotation = {
      id: input,
      type: "Manifest",
    };
  } else if (data.type == "Annotation") {
    annotation = data;
  }
  return annotation;
}

/* The logic for the functions below were copy/pasted from the 0.9 ContentState spec. 
  with some modifications added to make it function in the library.  

  See https://iiif.io/api/content-state/0.9/#232-examples-of-content-state-encoding

*/
export function encodeContentState(annotation) {
  let data = annotation;
  if (typeof annotation == "object") {
    data = JSON.stringify(annotation);
  }
  let uriEncoded = encodeURI(data); // using built in function
  let base64 = btoa(uriEncoded); // using built in function
  let base64url = base64.replace(/\+/g, "-").replace(/\//g, "_");
  let base64urlNoPadding = base64url.replace(/=/g, "");
  return base64urlNoPadding;
}

export function decodeContentState(encodedContentState) {
  let base64url = restorePadding(encodedContentState);
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  let base64Decoded = atob(base64); // using built in function
  let uriDecoded = decodeURI(base64Decoded); // using built in function
  return uriDecoded;
}

function restorePadding(s) {
  let pad = s.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new ContentStateError(
        "InvalidLengthError: Input base64url string is the wrong length to determine padding"
      );
    }
    s += new Array(5 - pad).join("=");
  }
  return s;
}

/**
 * Helper function to create a full link that includes the annotation param.
 *
 * @param  {string} url        The URL that should have a contentState param added.
 * @param  {Object} annotation The annotation Object
 * @return {string}            The augmented URL
 */
export function encodeLink(url, annotation) {
  let urlObj = new URL(url);
  let params = new URLSearchParams(urlObj.search);
  let data = `${encodeContentState(annotation)}`;
  params.append("iiif-content", data);
  const paramString = params.toString();
  let baseURL = urlObj.protocol + "//" + urlObj.host + urlObj.pathname;
  if (paramString) {
    baseURL = baseURL + "?" + paramString;
  }
  return baseURL;
}

/**
 * Extract the annotation information from a full URL
 * @param  {String} url The URL to parse
 * @return {Object}     The annotation data and manifest value
 */
export async function parseURL(url) {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    throw new ContentStateError("URL provided is not a valid URL.");
  }
  let params = new URLSearchParams(urlObj.search);
  if (!params.get("iiif-content")) {
    throw new ContentStateError("No iiif-content parameter in URL.");
  }

  return parseContentState(params.get("iiif-content"));
}

export async function parseContentState(input) {
  let annotation;
  if (input.startsWith("http")) {
    annotation = await checkURLType(input);
  } else {
    try {
      annotation = JSON.parse(decodeContentState(input));
    } catch {
      throw new ContentStateError(
        "Could not parse base64url string into JSON."
      );
    }
  }

  annotation = expandAnnotation(annotation);
  validateAnnotation(annotation);

  return {
    manifests: extractManifests(annotation),
    annotation: annotation,
  };
}

export default parseURL;
