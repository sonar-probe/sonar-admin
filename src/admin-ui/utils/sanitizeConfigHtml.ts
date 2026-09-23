import DOMPurify from "dompurify";

/**
 * Sanitizes the small amount of HTML formatting a plugin/theme config
 * schema is allowed to declare for its instructional "textbox" fields
 * (bold, links, line breaks, etc.). The schema itself comes from the
 * plugin/theme's own manifest, which is not trusted content — installing
 * a plugin does not imply it should be able to run arbitrary JS in the
 * admin's session just by having its config page opened.
 */
export function sanitizeConfigHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "strong", "i", "em", "u", "s", "br", "p", "span",
      "code", "pre", "ul", "ol", "li", "a",
    ],
    // No `target` — links open in the same tab, which also sidesteps the
    // reverse-tabnabbing risk of a target="_blank" link without rel="noopener".
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  });
}
