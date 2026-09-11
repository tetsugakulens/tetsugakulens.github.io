export const moods = [
  { id: "compare", slug: "compare", name: "比べてしまう" },
  { id: "indecisive", slug: "indecisive", name: "決められない" },
  { id: "unmotivated", slug: "unmotivated", name: "頑張れない" },
  { id: "hated", slug: "fear-of-dislike", name: "嫌われるのが怖い" },
  { id: "hurt", slug: "hurt", name: "傷ついている" },
  { id: "angry", slug: "angry", name: "腹が立つ" },
  { id: "lonely", slug: "lonely", name: "ひとりを感じる" },
  { id: "failure", slug: "fear-of-failure", name: "失敗が怖い" },
  { id: "uncertain", slug: "uncertain-future", name: "先が見えない" },
  { id: "meaning", slug: "meaning-of-life", name: "生きる意味を考えたい", sensitive: true },
] as const;

export const areas = [
  { id: "work", slug: "work", name: "仕事" },
  { id: "relationships", slug: "relationships", name: "人間関係" },
  { id: "love", slug: "love", name: "恋愛" },
  { id: "future", slug: "future", name: "将来" },
  { id: "study", slug: "study", name: "勉強" },
  { id: "career", slug: "career", name: "進路" },
  { id: "self", slug: "self", name: "自分自身" },
] as const;

export const moodName = (id: string) => moods.find((item) => item.id === id)?.name ?? id;
export const areaName = (id: string) => areas.find((item) => item.id === id)?.name ?? id;
