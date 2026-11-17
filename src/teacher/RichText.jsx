import { parseRich } from './richText.js';

const Inline = ({ parts }) => parts.map((x, k) => (x.t === 'b' ? <strong key={k}>{x.v}</strong> : x.t === 'i' ? <em key={k}>{x.v}</em> : x.t === 'phrase' ? <mark className="teacher-phrase" key={k}>{x.v}</mark> : <span key={k}>{x.v}</span>));

// Shows an accent-coach answer with bold headers, bullets and highlighted phrases.
export default function RichText({ text }) {
  const gap = { margin: '4px 0' }, list = { margin: '4px 0', paddingInlineStart: '1.2em' };
  return (<>{parseRich(text).map((b, i) => (b.type === 'p'
    ? <p key={i} style={gap}><Inline parts={b.inline} /></p>
    : b.type === 'ul'
      ? <ul key={i} style={list}>{b.items.map((it, k) => <li key={k}><Inline parts={it} /></li>)}</ul>
      : <ol key={i} style={list}>{b.items.map((it, k) => <li key={k}><Inline parts={it} /></li>)}</ol>))}</>);
}
