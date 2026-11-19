export function ReceiptLinks({text}:{text:string}) {
  const links=Array.from(new Set(text.match(/https:\/\/mail\.google\.com\/mail\/u\/0\/#all\/[a-zA-Z0-9_-]+/g)||[]));
  if(!links.length)return null;
  return <span className="mt-1 flex flex-wrap gap-3">{links.map((link,index)=><a key={link} href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-forest underline">Open Gmail receipt{links.length>1?` ${index+1}`:""}</a>)}</span>;
}
