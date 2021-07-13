import React, { useState } from "react";

import { Fzf, FzfResultItem } from "../lib/main";

interface Stuff {
  id: string;
  displayName: string;
}

const list: Stuff[] = [
  { id: "1", displayName: "abc" },
  { id: "2", displayName: "bcd" },
  { id: "3", displayName: "cde" },
  { id: "4", displayName: "def" },
];

const fzf = new Fzf(list, {
  selector: (v) => v.displayName,
});

export function Custom() {
  const [input, setInput] = useState("");

  const [results, setResults] = useState<FzfResultItem<Stuff>[]>([]);

  const handleInputChange = (input: string) => {
    setInput(input);
    if (input === "") {
      setResults([]);
      return;
    }

    let results = fzf.find(input);
    // limiting size of the result to avoid jank while rendering it
    results = results.slice(0, 32);
    setResults(results);
  };

  return (
    <div className="min-h-screen antialiased break-words px-6 py-4">
      <div>
        <input
          autoFocus
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className="py-2 px-3 w-full border-b-2 border-gray-400 outline-none focus:border-purple-500"
          placeholder="Type to search"
        />
      </div>
      <div className="pt-2">
        {input !== "" ? (
          <ul>
            {results.map((result) => (
              <li key={result.item.id} className="py-1">
                <HighlightChars
                  str={result.item.displayName}
                  highlightIndices={result.positions ?? []}
                />
                <span className="text-sm pl-4 italic text-gray-400">
                  {result.result.score}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600 py-1">
            List MRU + contextual when query or in frequency (frequent +
            recency) when input is empty
          </div>
        )}
      </div>
    </div>
  );
}

interface HighlightCharsProps {
  str: string;
  highlightIndices: number[];
}

const HighlightChars = (props: HighlightCharsProps) => {
  const strArr = props.str.split("");
  const nodes = strArr.map((v, i) => {
    if (props.highlightIndices.includes(i)) {
      return (
        <span key={i} className="font-semibold">
          {v}
        </span>
      );
    } else {
      return v;
    }
  });

  return <>{nodes}</>;
};
