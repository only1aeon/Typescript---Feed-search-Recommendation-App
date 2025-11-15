export function normalizeScores(hyps: { score: number; hypothesis: string }[]) {
  const minScore = Math.min(...hyps.map(h => h.score));
  const exps = hyps.map(h => Math.exp(-(h.score - minScore)));
  const sumExp = exps.reduce((a, b) => a + b, 0) + 1e-12;
  return exps.map(e => e / sumExp);
}

export function expectedTokenCount(word: string, segment: any) {
  if (!segment.asrLattice || segment.asrLattice.length === 0) {
    return (segment.transcript?.toLowerCase().split(" ").filter(w => w === word.toLowerCase()).length) || 0;
  }
  const probs = normalizeScores(segment.asrLattice);
  return probs.reduce((total, p, i) => {
    const hyp = segment.asrLattice[i].hypothesis.toLowerCase();
    const count = hyp.split(" ").filter(w => w === word.toLowerCase()).length;
    return total + p * count;
  }, 0);
}

export function tokenPresentProbability(word: string, segment: any) {
  if (!segment.asrLattice || segment.asrLattice.length === 0) {
    return segment.transcript?.toLowerCase().includes(word.toLowerCase()) ? 1 : 0;
  }
  const probs = normalizeScores(segment.asrLattice);
  let pNot = 1;
  for (let i = 0; i < segment.asrLattice.length; i++) {
    if (segment.asrLattice[i].hypothesis.toLowerCase().includes(word.toLowerCase())) {
      pNot *= 1 - probs[i];
    }
  }
  return 1 - pNot;
}
