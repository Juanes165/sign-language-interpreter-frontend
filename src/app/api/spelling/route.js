import nspell from "nspell";
import fs from "fs"
import dictionary from "dictionary-es-co";
import { NextResponse } from "next/server";

const dict = dictionary;
const spell = nspell(dict);


// Levenshtein distance function
// https://www.digitalocean.com/community/tutorials/levenshtein-distance-python
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

// Get words from hunspell dict
const allWords = new Set(
  Buffer.from(dict.dic)
    .toString("utf8")
    .split("\n")
    .map(l => l.split("/")[0].trim().toLowerCase())
    .filter(Boolean)
);

// Load ngrams model
const model = JSON.parse(fs.readFileSync("src/app/api/spelling/model.json", "utf8"));


export async function POST(req) {
  const { word, context } = await req.json();

  // Get the hunspell word suggestions
  const hunspellSuggestions = spell.suggest(word);

  // Get the levenshtein word suggestions
  const target = word.toLowerCase();
  const filtered = Array.from(allWords).filter(
    w => Math.abs(w.length - target.length) <= 2
  );
  const scored = filtered
    .map(w => ({
      word: w,
      distance: levenshtein(target, w)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
  const levenshteinSuggestions = scored.map(s => s.word);

  // combine both suggestions into one array, prioritizing the items in common (more important)
  const common = hunspellSuggestions.filter(x => levenshteinSuggestions.includes(x));
  const unique = [...new Set([...hunspellSuggestions, ...levenshteinSuggestions])];
  const combinedSuggestions = [...common, ...unique.filter(x => !common.includes(x))];

  // If no context provided then only return the base suggestions without most likely order
  if (!context) {
    return NextResponse.json({
      original: word,
      corrected: combinedSuggestions[0] || word,
      suggestions: combinedSuggestions.slice(1)
    })
  }

  // get the most likely word based on suggestions and context
  const scores = combinedSuggestions.map((cand) => {
    const entry = model[context] || {};
    const freq = entry[cand.toLowerCase()] || 0;
    return { word: cand, score: freq };
  });
  // console.log(hunspellSuggestions, levenshteinSuggestions, combinedSuggestions, scores)
  // console.log(levenshtein(word, scores[1].word), levenshtein(word, scores[3].word))
  // console.log(scores)
  const suggestions = scores
    .sort((a, b) => b.score - a.score);

  const corrected = suggestions[0]?.word || word;
  // console.log(suggestions)
  // console.log(corrected)

  return NextResponse.json({
    original: word,
    corrected,
    suggestions: suggestions.map(w => w.word).slice(1)
  });
}
