# ContentState.js

## API

## Classes

<dl>
<dt><a href="#ContentStateError">ContentStateError</a></dt>
<dd><p>This is the custom Error class we&#39;re assuming we&#39;ll throw on parse errors.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#expandAnnotation">expandAnnotation(annotation)</a> ⇒ <code>Object</code></dt>
<dd><p>Given a contentState annotation, add back in the context if it&#39;s missing.
Given a mimimal target-only contentState, assume that it&#39;s a target
and wrap it in the annotation.</p>
</dd>
<dt><a href="#validateAnnotation">validateAnnotation(annotation)</a></dt>
<dd><p>Given an annotation, confirm that it has the correct context and that it has
a target property.  Will throw errors if it is not.</p>
</dd>
<dt><a href="#isContentStateAnnotation">isContentStateAnnotation(annotation)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Inspect the motivation of an annotation and see if it contains
the &quot;contentState&quot; motivation.</p>
</dd>
<dt><a href="#encodeLink">encodeLink(url, annotation)</a> ⇒ <code>string</code></dt>
<dd><p>Helper function to create a full link that includes the annotation param.</p>
</dd>
<dt><a href="#parseURL">parseURL(url)</a> ⇒ <code>Object</code></dt>
<dd><p>Extract the annotation information from a full URL</p>
</dd>
</dl>

<a name="expandAnnotation"></a>

## expandAnnotation(annotation) ⇒ <code>Object</code>

Given a contentState annotation, add back in the context if it's missing.
Given a mimimal target-only contentState, assume that it's a target
and wrap it in the annotation.

**Kind**: global function
**Returns**: <code>Object</code> - the annotation with any transformations applied

| Param      | Type                | Description              |
| ---------- | ------------------- | ------------------------ |
| annotation | <code>Object</code> | the annotation to expand |

<a name="validateAnnotation"></a>

## validateAnnotation(annotation)

Given an annotation, confirm that it has the correct context and that it has
a target property. Will throw errors if it is not.

**Kind**: global function

| Param      | Type                | Description              |
| ---------- | ------------------- | ------------------------ |
| annotation | <code>Object</code> | the annotation to expand |

<a name="isContentStateAnnotation"></a>

## isContentStateAnnotation(annotation) ⇒ <code>Boolean</code>

Inspect the motivation of an annotation and see if it contains
the "contentState" motivation.

**Kind**: global function
**Returns**: <code>Boolean</code> - true if it's a contentState Annotation, false if not.

| Param      | Type                | Description               |
| ---------- | ------------------- | ------------------------- |
| annotation | <code>Object</code> | the annotation to inspect |

<a name="encodeLink"></a>

## encodeLink(url, annotation) ⇒ <code>string</code>

Helper function to create a full link that includes the annotation param.

**Kind**: global function
**Returns**: <code>string</code> - The augmented URL

| Param      | Type                | Description                                          |
| ---------- | ------------------- | ---------------------------------------------------- |
| url        | <code>string</code> | The URL that should have a contentState param added. |
| annotation | <code>Object</code> | The annotation Object                                |

<a name="parseURL"></a>

## parseURL(url) ⇒ <code>Object</code>

Extract the annotation information from a full URL

**Kind**: global function
**Returns**: <code>Object</code> - The annotation data and manifest value

| Param | Type                | Description      |
| ----- | ------------------- | ---------------- |
| url   | <code>String</code> | The URL to parse |

## Credits
