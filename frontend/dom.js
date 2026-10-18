// Builds an element. Text always goes through textContent / text nodes
// (never innerHTML), so AI-generated or user text can't inject markup.
export function el(tag, { text, ...props } = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  node.append(...children);
  return node;
}
