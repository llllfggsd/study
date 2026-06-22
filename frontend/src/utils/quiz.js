export function buildOptions(q) {
  if (Array.isArray(q.options) && q.options.length > 0) {
    return q.options.map((text, i) => ({ key: String.fromCharCode(65 + i), text }))
  }
  return [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
  ].filter((o) => o.text)
}

export function isMulti(q) {
  return q.qtype === 'multiple'
}
