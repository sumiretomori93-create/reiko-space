export type Direction = "left" | "right" | "up" | "down";
export type Round = { board: number[]; score: number };
export function moveBoard(board: number[], direction: Direction) {
  const next = [...board]; let gained = 0;
  const movements: {from:number;to:number;value:number}[] = [], merges:number[]=[];
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({length:4}, (_,i) => direction === "left" ? line*4+i : direction === "right" ? line*4+3-i : direction === "up" ? i*4+line : (3-i)*4+line);
    const sources = indices.filter(i=>board[i]); const merged: number[] = [];
    for(let i=0;i<sources.length;i++) {
      const from=sources[i], value=board[from], to=indices[merged.length];
      movements.push({from,to,value});
      if(value===board[sources[i+1]]) {movements.push({from:sources[++i],to,value});merged.push(value*2);gained+=value*2;merges.push(to);} else merged.push(value);
    }
    indices.forEach((index,i)=>{next[index]=merged[i]||0;});
  }
  return {board:next,gained,changed:next.some((value,i)=>value!==board[i]),movements,merges};
}

export function spawn(board: number[], random = Math.random) { const empty=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);const next=[...board];if(empty.length)next[empty[Math.min(empty.length-1,Math.floor(random()*empty.length))]]=random()<.9?2:4;return next; }
export function freshRound(): Round {return {board:spawn(spawn(Array(16).fill(0))),score:0};}
export function ended(board: number[]) {return !board.includes(0) && !(["left","right","up","down"] as Direction[]).some(d=>moveBoard(board,d).changed);}
export function validRound(value: unknown): value is Round {if(!value||typeof value!=="object")return false;const r=value as Round;return Array.isArray(r.board)&&r.board.length===16&&r.board.every(v=>Number.isSafeInteger(v)&&v>=0&&(v===0||(v>=2&&Math.log2(v)%1===0)))&&Number.isSafeInteger(r.score)&&r.score>=0;}
